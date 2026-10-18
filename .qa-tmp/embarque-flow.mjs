import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const VIAJE_ID = "v2"; // 39 vendidos, estado "confirmado" — mezcla pendiente/embarcado
const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];

const log = [];
function record(section, data) {
  log.push({ section, data, ts: new Date().toISOString() });
  console.log("===", section, "===");
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const browser = await chromium.launch();

  // ---- Ronda 1: flujo funcional completo en 360x640 ----
  const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
  await context.addCookies([
    { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
    { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) consoleMsgs.push(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
  });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));

  // Shell check: sin TopBar/Footer publico
  await page.goto(`${BASE}/embarque`, { waitUntil: "networkidle" });
  const shellCheck = await page.evaluate(() => ({
    tieneIngresar: !!document.body.innerText.match(/Ingresar/),
    tieneFooterInstitucional: !!document.querySelector("footer"),
    tieneEmbarqueHeader: !!document.body.innerText.match(/Embarque/),
  }));
  record("shell-embarque-page", shellCheck);
  await page.screenshot({ path: ".qa-tmp/shots/embarque-01-lista.png", fullPage: true });

  // Descargar manifiesto de v2 (buscar la card por texto del viaje)
  const overflowBefore = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  record("overflow-lista-viajes-360", overflowBefore);

  // localizar boton "Descargar" dentro de la tarjeta del viaje v2 -- usamos el segundo boton "Descargar" visible (orden de VIAJES_DEL_DIA: v1,v2,v4,v6,v8,v12)
  const botonesDescargar = page.getByRole("button", { name: /Descargar/i });
  const countBotones = await botonesDescargar.count();
  record("botones-descargar-encontrados", { countBotones });
  // Click en el primero disponible (v1 podría estar "lleno" pero igual descargable)
  await botonesDescargar.nth(1).click(); // nth(1) -> v2 si v1 es el primero
  await page.waitForURL(/\/embarque\/.+/, { timeout: 10000 });
  record("url-tras-descarga", { url: page.url() });
  await page.waitForTimeout(500);

  // Leer IndexedDB para obtener codigos de boleto pendiente y ya-embarcado
  const idbData = await page.evaluate(async (viajeId) => {
    function abrir() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("ecosem-embarque", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    function getAll(db, store) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    const db = await abrir();
    const manifiestos = await getAll(db, "manifiestos");
    const escaneos = await getAll(db, "escaneos");
    db.close();
    const manifiesto = manifiestos.find((m) => m.viajeId === viajeId);
    const codigosEscaneados = new Set(escaneos.filter((e) => e.viajeId === viajeId).map((e) => e.codigoBoleto));
    const pendiente = manifiesto.pasajeros.find((p) => !codigosEscaneados.has(p.codigoBoleto));
    const yaEmbarcado = manifiesto.pasajeros.find((p) => codigosEscaneados.has(p.codigoBoleto));
    return {
      totalPasajeros: manifiesto.pasajeros.length,
      totalEscaneosSembrados: escaneos.length,
      codigoPendiente: pendiente?.codigoBoleto,
      codigoYaEmbarcado: yaEmbarcado?.codigoBoleto,
    };
  }, VIAJE_ID);
  record("idb-data", idbData);

  const overflowEscaneo = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  record("overflow-escaneo-360", overflowEscaneo);
  await page.screenshot({ path: ".qa-tmp/shots/embarque-02-escaneo-inicial.png", fullPage: true });

  // Estado de camara (deberia caer a no-disponible en headless sin camara real)
  await page.waitForTimeout(800);
  const estadoCamaraTexto = await page.locator("text=/cámara|manual/i").allTextContents();
  record("mensajes-camara", estadoCamaraTexto);

  // --- Caso VALIDO ---
  const inputCodigo = page.getByLabel("Código de reserva");
  await inputCodigo.fill(idbData.codigoPendiente);
  await inputCodigo.press("Enter");
  await page.waitForTimeout(300);
  const resultadoValido = await page.locator('[role="status"]').last().textContent();
  record("resultado-caso-valido", { codigo: idbData.codigoPendiente, texto: resultadoValido });
  await page.screenshot({ path: ".qa-tmp/shots/embarque-03-valido.png" });

  // cerrar banner
  const botonListo = page.getByRole("button", { name: /Listo, siguiente/i });
  if (await botonListo.count()) await botonListo.click();

  // --- Caso REPETIDO (mismo codigo otra vez) ---
  await inputCodigo.fill(idbData.codigoPendiente);
  await inputCodigo.press("Enter");
  await page.waitForTimeout(300);
  const resultadoRepetido = await page.locator('[role="status"]').last().textContent();
  record("resultado-caso-repetido", { codigo: idbData.codigoPendiente, texto: resultadoRepetido });
  await page.screenshot({ path: ".qa-tmp/shots/embarque-04-repetido.png" });
  if (await botonListo.count()) await botonListo.click();

  // --- Caso YA-EMBARCADO SEMBRADO (uno que ya estaba embarcado antes de escanear nada) ---
  await inputCodigo.fill(idbData.codigoYaEmbarcado ?? "ECH-000000");
  await inputCodigo.press("Enter");
  await page.waitForTimeout(300);
  const resultadoSembrado = await page.locator('[role="alert"], [role="status"]').last().textContent();
  record("resultado-caso-ya-embarcado-sembrado", { codigo: idbData.codigoYaEmbarcado, texto: resultadoSembrado });
  if (await botonListo.count()) await botonListo.click();
  const botonListoAlert = page.locator('[role="alert"] button');
  if (await botonListoAlert.count()) await botonListoAlert.click();

  // --- Caso INVALIDO (codigo inventado) ---
  await inputCodigo.fill("ECH-ZZZZZZ");
  await inputCodigo.press("Enter");
  await page.waitForTimeout(300);
  const resultadoInvalido = await page.locator('[role="alert"]').last().textContent();
  record("resultado-caso-invalido", { texto: resultadoInvalido });
  await page.screenshot({ path: ".qa-tmp/shots/embarque-05-invalido.png" });

  // --- Caso VACIO (submit sin codigo) ---
  await inputCodigo.fill("");
  await inputCodigo.press("Enter");
  await page.waitForTimeout(200);
  const errorVacio = await page.locator("text=/Ingresa el código/i").count();
  record("resultado-caso-vacio", { mostroError: errorVacio > 0 });

  // ---- OFFLINE: desconectar red real y repetir validaciones ----
  await context.setOffline(true);
  record("contexto-offline", { offline: true });

  // nuevo codigo pendiente para probar offline (recalcular desde idb, tomar otro pendiente distinto)
  const idbData2 = await page.evaluate(async (viajeId) => {
    function abrir() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("ecosem-embarque", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    function getAll(db, store) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    const db = await abrir();
    const manifiestos = await getAll(db, "manifiestos");
    const escaneos = await getAll(db, "escaneos");
    db.close();
    const manifiesto = manifiestos.find((m) => m.viajeId === viajeId);
    const codigosEscaneados = new Set(escaneos.filter((e) => e.viajeId === viajeId).map((e) => e.codigoBoleto));
    const otroPendiente = manifiesto.pasajeros.find((p) => !codigosEscaneados.has(p.codigoBoleto));
    return { otroPendiente: otroPendiente?.codigoBoleto };
  }, VIAJE_ID);
  record("idb-data-offline-target", idbData2);

  await inputCodigo.fill(idbData2.otroPendiente);
  await inputCodigo.press("Enter");
  await page.waitForTimeout(400);
  const resultadoOffline = await page.locator('[role="status"]').last().textContent();
  record("resultado-caso-valido-OFFLINE", { codigo: idbData2.otroPendiente, texto: resultadoOffline });
  await page.screenshot({ path: ".qa-tmp/shots/embarque-06-offline-valido.png" });
  if (await botonListo.count()) await botonListo.click();

  // repetido offline
  await inputCodigo.fill(idbData2.otroPendiente);
  await inputCodigo.press("Enter");
  await page.waitForTimeout(400);
  const resultadoOfflineRepetido = await page.locator('[role="status"]').last().textContent();
  record("resultado-repetido-OFFLINE", { texto: resultadoOfflineRepetido });
  if (await botonListo.count()) await botonListo.click();

  // invalido offline
  await inputCodigo.fill("ECH-OFFLIN");
  await inputCodigo.press("Enter");
  await page.waitForTimeout(400);
  const resultadoOfflineInvalido = await page.locator('[role="alert"]').last().textContent();
  record("resultado-invalido-OFFLINE", { texto: resultadoOfflineInvalido });

  // contador pendientes de sincronizar mientras offline
  const contadorHeaderOffline = await page.locator("header").innerText();
  record("header-mientras-offline", { texto: contadorHeaderOffline });
  await page.screenshot({ path: ".qa-tmp/shots/embarque-07-offline-header.png" });

  // ---- Reconectar y verificar sincronizacion ----
  await context.setOffline(false);
  record("contexto-online-de-nuevo", { offline: false });
  await page.waitForTimeout(1500); // deja correr el listener 'online' -> sincronizarAhora
  const pendientesTrasReconectar = await page.evaluate(async () => {
    function abrir() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open("ecosem-embarque", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    function getAll(db, store) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    const db = await abrir();
    const escaneos = await getAll(db, "escaneos");
    db.close();
    return {
      total: escaneos.length,
      sinSincronizar: escaneos.filter((e) => !e.sincronizado).length,
    };
  });
  record("estado-sync-tras-reconectar", pendientesTrasReconectar);
  const headerTrasReconectar = await page.locator("header").innerText();
  record("header-tras-reconectar", { texto: headerTrasReconectar });
  await page.screenshot({ path: ".qa-tmp/shots/embarque-08-tras-sync.png" });

  // Verificar URL / consola: DNI no debe aparecer en URL en ningun momento
  record("url-final", { url: page.url() });

  // Tab focus check en la pantalla de escaneo
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focoVisibleInfo = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    return { tag: el.tagName, outline: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  record("foco-tab-check", focoVisibleInfo);

  record("consola-acumulada", { consoleMsgs: [...new Set(consoleMsgs)], pageErrors: [...new Set(pageErrors)] });

  await context.close();

  // ---- Ronda 2 y 3: overflow en otros viewports (rapido, sin repetir todo el flujo) ----
  for (const vp of VIEWPORTS.slice(1)) {
    const ctx2 = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx2.addCookies([
      { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
      { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
    ]);
    const p2 = await ctx2.newPage();
    const msgs2 = [];
    p2.on("console", (m) => { if (["error","warning"].includes(m.type())) msgs2.push(`[${m.type()}] ${m.text().slice(0,200)}`); });
    const errs2 = [];
    p2.on("pageerror", (e) => errs2.push(String(e).slice(0,300)));

    await p2.goto(`${BASE}/embarque`, { waitUntil: "networkidle" });
    const of1 = await p2.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
    await p2.screenshot({ path: `.qa-tmp/shots/embarque-lista-${vp.name}.png`, fullPage: true });

    const btn = p2.getByRole("button", { name: /Descargar|Abrir/i }).nth(1);
    await btn.click();
    await p2.waitForURL(/\/embarque\/.+/, { timeout: 10000 });
    await p2.waitForTimeout(600);
    const of2 = await p2.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
    await p2.screenshot({ path: `.qa-tmp/shots/embarque-escaneo-${vp.name}.png`, fullPage: true });

    record(`overflow-y-consola-${vp.name}`, { listaOverflow: of1, escaneoOverflow: of2, consoleMsgs: [...new Set(msgs2)], pageErrors: [...new Set(errs2)] });
    await ctx2.close();
  }

  await browser.close();
  fs.writeFileSync(".qa-tmp/embarque-log.json", JSON.stringify(log, null, 2));
  console.log("DONE");
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e);
  fs.writeFileSync(".qa-tmp/embarque-log.json", JSON.stringify(log, null, 2));
  process.exit(1);
});
