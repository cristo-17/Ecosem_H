import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 700 } });
const page = await context.newPage();
const consoleMsgs = [];
page.on("console", (m) => { if (["error","warning"].includes(m.type())) consoleMsgs.push(m.text().slice(0,150)); });
page.on("pageerror", (e) => consoleMsgs.push("[pageerror] "+String(e).slice(0,150)));
async function ocultar() {
  await page.evaluate(() => { const el=document.getElementById("selector-rol-demo"); if (el) el.style.display="none"; }).catch(()=>{});
}

// --- Registro ---
await page.goto("http://localhost:3000/registro", { waitUntil: "networkidle" });
await ocultar();
const camposRegistro = await page.locator("label").allTextContents();
console.log("Registro - labels:", camposRegistro);
const lsRegistro = await page.evaluate(() => JSON.stringify(localStorage));
console.log("Registro - localStorage:", lsRegistro);

// --- Cotizador de encomiendas: caso con tarifa definida y caso sin tarifa ---
await page.goto("http://localhost:3000/encomiendas/enviar", { waitUntil: "networkidle" });
await ocultar();
await page.getByLabel("Origen").click();
await page.getByRole("option", { name: "Lima" }).click();
await page.getByLabel("Destino").click();
await page.getByRole("option", { name: "Huancayo" }).click();
await page.getByLabel(/Peso real/i).fill("10");
const largoInput = page.getByLabel(/^Largo/i);
if (await largoInput.count()) await largoInput.fill("40");
const anchoInput = page.getByLabel(/^Ancho/i);
if (await anchoInput.count()) await anchoInput.fill("30");
const altoInput = page.getByLabel(/^Alto/i);
if (await altoInput.count()) await altoInput.fill("20");
await page.getByRole("button", { name: "Cotizar" }).click({ force: true });
await page.waitForTimeout(500);
console.log("Cotizador Lima-Huancayo:", (await page.locator("body").innerText()).slice(0, 900));

// --- Rastrear encomienda ---
await page.goto("http://localhost:3000/encomiendas/rastrear", { waitUntil: "networkidle" });
await ocultar();
const inputGuia = page.getByLabel(/guía|código/i).first();
if (await inputGuia.count()) {
  await inputGuia.fill("ENC-000001");
  const rastrearBtn = page.getByRole("button", { name: /Rastrear|Buscar/i });
  await rastrearBtn.click({ force: true });
  await page.waitForTimeout(500);
  console.log("Rastreo body:", (await page.locator("body").innerText()).slice(0, 700));
}

// --- Libro de reclamaciones: enviar vacío para ver validación, luego lleno ---
await page.goto("http://localhost:3000/libro-de-reclamaciones", { waitUntil: "networkidle" });
await ocultar();
const enviarBtn = page.getByRole("button", { name: /Enviar reclamo/i });
await enviarBtn.click({ force: true });
await page.waitForTimeout(300);
console.log("Libro reclamaciones tras enviar vacío:", (await page.locator("body").innerText()).slice(0, 500));
console.log("URL tras enviar vacío (nunca debe ser ancla #):", page.url());

await browser.close();
console.log("--- consola acumulada ---");
consoleMsgs.forEach((m) => console.log(m));
