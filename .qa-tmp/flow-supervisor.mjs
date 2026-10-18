import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const SHOTS = path.resolve(import.meta.dirname, "shots-supervisor");
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "1440x900", width: 1440, height: 900 },
];

async function ctx(browser, vp) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await context.addCookies([
    { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
    { name: "ecosem_rol_demo", value: "supervisor", domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleMsgs.push(`[${m.type()}] ${m.text().slice(0,200)}`); });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0,200)));
  return { context, page, consoleMsgs, pageErrors };
}

async function overflow(page) {
  return page.evaluate(() => ({ w: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
}

const report = [];

async function runPrecios(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await ctx(browser, vp);
  const log = { vp: vp.name, area: "precios", notes: [] };
  try {
    await page.goto(`${BASE}/panel/precios`, { waitUntil: "networkidle" });
    log.notes.push({ overflow: await overflow(page) });
    await page.screenshot({ path: path.join(SHOTS, `${vp.name}__precios-01.png`), fullPage: true });
    const texto = await page.locator("body").innerText();
    log.notes.push({ preview: texto.slice(0, 1500) });
  } catch (e) { log.error = String(e).slice(0,400); }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function runTarifario(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await ctx(browser, vp);
  const log = { vp: vp.name, area: "tarifario", notes: [] };
  try {
    await page.goto(`${BASE}/panel/tarifario`, { waitUntil: "networkidle" });
    log.notes.push({ overflow: await overflow(page) });
    await page.screenshot({ path: path.join(SHOTS, `${vp.name}__tarifario-01.png`), fullPage: true });
    const texto = await page.locator("body").innerText();
    log.notes.push({ preview: texto.slice(0, 2000) });
  } catch (e) { log.error = String(e).slice(0,400); }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function runFlotaConductores(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await ctx(browser, vp);
  const log = { vp: vp.name, area: "flota-conductores", notes: [] };
  try {
    await page.goto(`${BASE}/panel/flota`, { waitUntil: "networkidle" });
    log.notes.push({ step: "flota-lista", overflow: await overflow(page) });
    await page.screenshot({ path: path.join(SHOTS, `${vp.name}__flota-01.png`), fullPage: true });

    await page.goto(`${BASE}/panel/flota/AGX-921`, { waitUntil: "networkidle" });
    log.notes.push({ step: "flota-detalle", overflow: await overflow(page) });
    await page.screenshot({ path: path.join(SHOTS, `${vp.name}__flota-02-detalle.png`), fullPage: true });
    const textoFlota = await page.locator("body").innerText();
    log.notes.push({ step: "flota-detalle-texto", preview: textoFlota.slice(0, 1200) });

    await page.goto(`${BASE}/panel/conductores`, { waitUntil: "networkidle" });
    log.notes.push({ step: "conductores", overflow: await overflow(page) });
    await page.screenshot({ path: path.join(SHOTS, `${vp.name}__conductores-01.png`), fullPage: true });
    const textoCond = await page.locator("body").innerText();
    log.notes.push({ step: "conductores-texto", preview: textoCond.slice(0, 1200) });
  } catch (e) { log.error = String(e).slice(0,400); }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function runAlertas(browser, vp) {
  const { context, page, consoleMsgs, pageErrors } = await ctx(browser, vp);
  const log = { vp: vp.name, area: "alertas", notes: [] };
  try {
    await page.goto(`${BASE}/panel/alertas`, { waitUntil: "networkidle" });
    log.notes.push({ overflow: await overflow(page) });
    const textoInicial = await page.locator("body").innerText();
    log.notes.push({ preview: textoInicial.slice(0, 1500) });
    await page.screenshot({ path: path.join(SHOTS, `${vp.name}__alertas-01.png`), fullPage: true });

    const btnAtender = page.getByRole("button", { name: /marcar como atendida/i }).first();
    if (await btnAtender.count()) {
      await btnAtender.focus();
      const beforeActive = await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 120));
      await btnAtender.click();
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(SHOTS, `${vp.name}__alertas-02-modal.png`) });

      const dialog = page.locator('[role="dialog"]');
      const dialogCount = await dialog.count();
      log.notes.push({ step: "modal-abierto", dialogCount });

      // Focus trap check: Tab many times, confirm focus stays within dialog
      let escapedFocus = false;
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(() => {
          const dlg = document.querySelector('[role="dialog"]');
          return dlg ? dlg.contains(document.activeElement) : null;
        });
        if (inside === false) escapedFocus = true;
      }
      log.notes.push({ step: "focus-trap-tab15", escapedFocus });

      // fill nota + responsable if present, then submit
      const inputs = dialog.locator("input, textarea, select, button");
      const count = await inputs.count();
      log.notes.push({ step: "modal-elementos-interactivos", count });

      // Try filling any text inputs with a note
      const textInputs = dialog.locator('input[type="text"], textarea, input:not([type])');
      const textCount = await textInputs.count();
      for (let i = 0; i < textCount; i++) {
        await textInputs.nth(i).fill("Revisado en QA — prueba automatizada").catch(() => {});
      }

      const confirmBtn = dialog.getByRole("button", { name: /confirmar|guardar|atendid/i }).last();
      if (await confirmBtn.count()) {
        await confirmBtn.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }

      const afterActive = await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 120));
      log.notes.push({ step: "foco-antes-abrir", beforeActive });
      log.notes.push({ step: "foco-tras-cerrar", afterActive, coincide: beforeActive === afterActive });
      await page.screenshot({ path: path.join(SHOTS, `${vp.name}__alertas-03-tras-cerrar.png`), fullPage: true });

      const textoFinal = await page.locator("body").innerText();
      log.notes.push({ step: "texto-tras-atender", preview: textoFinal.slice(0, 1500) });
    } else {
      log.notes.push({ step: "sin-boton-atender" });
    }
  } catch (e) { log.error = String(e).slice(0,500); }
  log.consoleMsgs = [...new Set(consoleMsgs)];
  log.pageErrors = [...new Set(pageErrors)];
  report.push(log);
  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    await runPrecios(browser, vp);
    await runTarifario(browser, vp);
    await runFlotaConductores(browser, vp);
    await runAlertas(browser, vp);
  }
  await browser.close();
  fs.writeFileSync(path.resolve(import.meta.dirname, "resultados-supervisor.json"), JSON.stringify(report, null, 2));
  console.log("DONE");
}

main();
