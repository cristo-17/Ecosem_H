import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const SHOTS = path.resolve(import.meta.dirname, "shots-panel");
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];

function fmtDate(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function newRoleContext(browser, vp, rol) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, acceptDownloads: true });
  const cookies = [{ name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" }];
  if (rol) cookies.push({ name: "ecosem_rol_demo", value: rol, domain: "localhost", path: "/" });
  await context.addCookies(cookies);
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) consoleMsgs.push(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
  });
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 200)));
  return { context, page, consoleMsgs, pageErrors };
}

async function overflowCheck(page) {
  return page.evaluate(() => ({
    docScrollW: document.documentElement.scrollWidth,
    docClientW: document.documentElement.clientWidth,
  }));
}

async function shot(page, vp, name) {
  await page.screenshot({ path: path.join(SHOTS, `${vp.name}__${name}.png`), fullPage: true }).catch(() => {});
}

const report = [];

async function runVentaFlow(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await newRoleContext(browser, vp, "counter");
  const log = { vp: vp.name, flow: "venta", steps: [] };
  try {
    await page.goto(`${BASE}/panel/venta`, { waitUntil: "networkidle" });
    await shot(page, vp, "venta-01-buscar");
    log.steps.push({ step: "buscar-load", overflow: await overflowCheck(page) });

    // Origen
    await page.getByLabel("Origen").click();
    await page.getByRole("option", { name: "Lima" }).click();
    await page.getByLabel("Destino").click();
    await page.getByRole("option", { name: "Huancayo" }).click();

    // Fecha: abrir y elegir hoy
    await page.getByLabel("Fecha de viaje").click();
    const hoy = new Date();
    await page.locator(`button[data-date="${fmtDate(hoy)}"]`).click();

    await page.getByRole("button", { name: "Buscar" }).click();
    await page.waitForTimeout(300);
    await shot(page, vp, "venta-02-resultados");
    log.steps.push({ step: "resultados", overflow: await overflowCheck(page) });

    const seleccionar = page.getByRole("button", { name: "Seleccionar" }).first();
    const hayResultados = await seleccionar.count();
    log.steps.push({ step: "resultados-count", hayResultados });
    if (hayResultados) {
      await seleccionar.click();
      await page.waitForTimeout(200);
      await shot(page, vp, "venta-03-asientos");
      log.steps.push({ step: "asientos", overflow: await overflowCheck(page) });

      const asientoLibre = page.locator('button[aria-label*="libre"]').first();
      await asientoLibre.click();
      await page.waitForTimeout(150);
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.waitForTimeout(200);
      await shot(page, vp, "venta-04-datos");
      log.steps.push({ step: "datos", overflow: await overflowCheck(page) });

      // Probar validación: click Confirmar sin llenar nada primero (solo en 1440 para no repetir 3 veces algo irrelevante)
      // Llenar datos del pasajero
      await page.getByLabel("Tipo de documento").click();
      await page.getByRole("option", { name: "DNI" }).click().catch(() => {});
      await page.getByLabel("N.° de documento").fill("45678912");
      await page.getByLabel("Nombres y apellidos").fill("Juana Quispe Rojas");
      await page.getByLabel("Correo electrónico").fill("juana.quispe@example.com");
      await page.getByLabel("Celular").fill("987654321");

      await page.getByLabel("Medio de pago").click();
      const opcionesPago = await page.getByRole("option").allTextContents();
      log.steps.push({ step: "opciones-medio-pago", opcionesPago });
      await page.getByRole("option").first().click();

      // localStorage check antes de confirmar
      const lsAntes = await page.evaluate(() => JSON.stringify(localStorage));
      log.steps.push({ step: "localStorage-antes-confirmar", lsAntes });

      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 10000 }).catch(() => null),
        page.getByRole("button", { name: "Confirmar venta" }).click(),
      ]);
      await page.waitForTimeout(300);
      await shot(page, vp, "venta-05-confirmado");
      log.steps.push({ step: "confirmado", overflow: await overflowCheck(page), downloadOk: Boolean(download), downloadName: download ? download.suggestedFilename() : null });

      const lsDespues = await page.evaluate(() => JSON.stringify(localStorage));
      log.steps.push({ step: "localStorage-despues-confirmar", lsDespues });

      const bodyText = await page.locator("body").innerText();
      const codigoMatch = bodyText.match(/Código\s+([A-Z0-9-]+)/);
      log.steps.push({ step: "codigo-boleto", codigoMatch: codigoMatch ? codigoMatch[1] : null });
    }
  } catch (e) {
    log.error = String(e).slice(0, 500);
  }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function runCajaFlow(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await newRoleContext(browser, vp, "counter");
  const log = { vp: vp.name, flow: "caja", steps: [] };
  try {
    await page.goto(`${BASE}/panel/caja`, { waitUntil: "networkidle" });
    await shot(page, vp, "caja-01-inicial");
    log.steps.push({ step: "load", overflow: await overflowCheck(page) });
    const bodyText = await page.locator("body").innerText();
    log.steps.push({ step: "texto", preview: bodyText.slice(0, 800) });

    const cerrarTurno = page.getByRole("button", { name: /cerrar turno/i });
    if (await cerrarTurno.count()) {
      await cerrarTurno.first().click();
      await page.waitForTimeout(300);
      await shot(page, vp, "caja-02-tras-cerrar");
      log.steps.push({ step: "tras-cerrar-turno", overflow: await overflowCheck(page) });
    }
  } catch (e) {
    log.error = String(e).slice(0, 500);
  }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function runViajesFlow(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await newRoleContext(browser, vp, "counter");
  const log = { vp: vp.name, flow: "viajes", steps: [] };
  try {
    await page.goto(`${BASE}/panel/viajes`, { waitUntil: "networkidle" });
    await shot(page, vp, "viajes-01-lista");
    log.steps.push({ step: "load", overflow: await overflowCheck(page) });
    const bodyText = await page.locator("body").innerText();
    log.steps.push({ step: "texto", preview: bodyText.slice(0, 1000) });

    for (const id of ["v1", "v4"]) {
      await page.goto(`${BASE}/panel/viajes/${id}`, { waitUntil: "networkidle" });
      await shot(page, vp, `viajes-02-detalle-${id}`);
      log.steps.push({ step: `detalle-${id}`, overflow: await overflowCheck(page) });
      const detalleTexto = await page.locator("body").innerText();
      log.steps.push({ step: `detalle-${id}-texto`, preview: detalleTexto.slice(0, 600) });

      const generarBtn = page.getByRole("button", { name: /generar manifiesto/i });
      if (await generarBtn.count()) {
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 10000 }).catch(() => null),
          generarBtn.first().click(),
        ]);
        log.steps.push({ step: `manifiesto-${id}-download`, ok: Boolean(download), name: download ? download.suggestedFilename() : null });
      }
    }
  } catch (e) {
    log.error = String(e).slice(0, 500);
  }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    await runVentaFlow(browser, vp);
    await runCajaFlow(browser, vp);
    await runViajesFlow(browser, vp);
  }
  await browser.close();
  fs.writeFileSync(path.resolve(import.meta.dirname, "resultados-panel-flujo.json"), JSON.stringify(report, null, 2));
  console.log("DONE");
}

main();
