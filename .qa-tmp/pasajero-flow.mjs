import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 700 }, acceptDownloads: true });
const page = await context.newPage();
const consoleMsgs = [];
page.on("console", (m) => { if (["error","warning"].includes(m.type())) consoleMsgs.push(m.text().slice(0,150)); });
page.on("pageerror", (e) => consoleMsgs.push("[pageerror] "+String(e).slice(0,150)));

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
// Oculta el selector de rol dev-only (fixed bottom, z-30) para que no
// intercepte clics reales durante las pruebas automatizadas: es una
// herramienta de desarrollo, no algo que un usuario real vea.
async function ocultarSelectorDev() {
  await page.evaluate(() => {
    const el = document.getElementById("selector-rol-demo");
    if (el) el.style.display = "none";
  }).catch(() => {});
}
await ocultarSelectorDev();
await page.getByLabel("Origen").click();
await page.getByRole("option", { name: "Lima" }).click();
await page.getByLabel("Destino").click();
await page.getByRole("option", { name: "Huancayo" }).click();
await page.getByLabel("Fecha de ida").click();
await page.waitForTimeout(200);
await page.locator('[role="dialog"] button[data-date]:not([aria-disabled="true"])').first().click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Buscar" }).click();
await page.waitForURL(/resultados/, { timeout: 10000 });
await page.getByText("Buscando los mejores horarios").waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
await page.waitForTimeout(300);

const precioListaTexto = await page.locator("text=/S\\/ \\d/").first().textContent();
console.log("1. Precio en lista:", precioListaTexto);

await page.getByRole("button", { name: "Seleccionar" }).first().click();
await page.waitForTimeout(500);
const continuarResultados = page.getByRole("button", { name: "Continuar" });
console.log("1b. Continuar disabled?", await continuarResultados.isDisabled());
await continuarResultados.click({ force: true });
await page.waitForTimeout(500);
console.log("1c. URL tras click continuar resultados:", page.url());
if (!/asientos/.test(page.url())) {
  await continuarResultados.click({ force: true });
  await page.waitForTimeout(500);
  console.log("1d. URL tras 2do intento:", page.url());
}
await page.waitForTimeout(500);
console.log("2. URL asientos (esperado):", page.url());
console.log("2. localStorage en asientos:", await page.evaluate(() => JSON.stringify(localStorage)));

const timerLocator = page.getByText(/reservad[oa].{0,30}\d{1,2}:\d{2}/i).first();
const timerCount = await timerLocator.count();
console.log("2. Temporizador visible:", timerCount > 0 ? await timerLocator.textContent() : "NO ENCONTRADO (buscar manualmente)");
console.log("2. body (buscar temporizador a mano):", (await page.locator("body").innerText()).slice(0, 600));

const countLibres = await page.locator('button[aria-label*="siento" i]:not([disabled])').count();
console.log("2. asientos libres disponibles:", countLibres);
await page.locator('button[aria-label*="siento" i]:not([disabled])').first().click({ force: true });
await page.waitForTimeout(200);
const precioAsientos = await page.locator("text=/S\\/ \\d/").first().textContent().catch(() => null);
console.log("2. Precio mostrado en selección de asiento:", precioAsientos);

await page.getByRole("button", { name: /Continuar/i }).click({ force: true });
await page.waitForURL(/datos/, { timeout: 10000 });
await page.waitForTimeout(300);
console.log("3. URL datos:", page.url());
console.log("3. localStorage en datos:", await page.evaluate(() => JSON.stringify(localStorage)));

// Llenar formulario de datos del pasajero
await page.getByLabel("Nombres y apellidos").first().fill("Maria Quispe Rojas");
await page.getByLabel("N.° de documento").first().fill("74812213");
const celInput = page.getByLabel("Celular").first();
if (await celInput.count()) await celInput.fill("987654321");
const emailInput = page.getByLabel("Correo electrónico").first();
if (await emailInput.count()) await emailInput.fill("maria.qa@example.com");

await page.waitForTimeout(200);
const continuarDatosBtn = page.getByRole("button", { name: /Continuar|Ir a pago/i });
await continuarDatosBtn.click({ force: true });
await page.waitForTimeout(500);
console.log("4. URL tras enviar datos:", page.url());
if (!/pago/.test(page.url())) {
  console.log("4. NO avanzó a pago. body:", (await page.locator("body").innerText()).slice(0, 600));
}
console.log("4. localStorage en pago:", await page.evaluate(() => JSON.stringify(localStorage)));
const precioPago = await page.locator("text=/S\\/ \\d/").first().textContent().catch(() => null);
console.log("4. Precio mostrado en pago:", precioPago);
console.log("4. body pago:", (await page.locator("body").innerText()).slice(0, 900));

// Probar un error de validación de pago (dejar RUC vacío al elegir factura, o tarjeta sin numero)
const opcionesPago = await page.locator('button[role="radio"], input[type="radio"] + label, [role="tab"]').allTextContents().catch(() => []);
console.log("4. opciones de pago detectadas:", opcionesPago);

// Elegir método de pago Yape (el más simple, sin campos de tarjeta)
const yapeOpcion = page.getByText("Yape", { exact: true }).first();
if (await yapeOpcion.count()) await yapeOpcion.click({ force: true });
await page.waitForTimeout(300);
console.log("4b. body tras elegir Yape:", (await page.locator("body").innerText()).slice(0, 700));

// Intentar pagar sin llenar nada (para forzar validacion) si hay boton Pagar
const pagarBtn = page.getByRole("button", { name: /Pagar|Confirmar pago|Ya pagué/i });
if (await pagarBtn.count()) {
  await pagarBtn.click({ force: true });
  await page.waitForURL(/confirmacion/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  console.log("5. URL tras click Pagar (puede quedarse si valida):", page.url());
  console.log("5. body tras click Pagar:", (await page.locator("body").innerText()).slice(0, 500));
  // Si sigue en pago, completar tarjeta con datos de prueba y reintentar
  const numTarjeta = page.getByLabel(/número de tarjeta|n.{1,3} de tarjeta/i).first();
  if (await numTarjeta.count()) {
    await numTarjeta.fill("4111111111111111");
    const venc = page.getByLabel(/vencimiento|mm\/aa/i).first();
    if (await venc.count()) await venc.fill("12/29");
    const cvv = page.getByLabel(/cvv|código de seguridad/i).first();
    if (await cvv.count()) await cvv.fill("123");
    await pagarBtn.click({ force: true });
    await page.waitForTimeout(800);
    console.log("6. URL tras completar tarjeta y pagar:", page.url());
  }
}

if (/confirmacion/.test(page.url())) {
  console.log("7. Llegó a confirmación. localStorage:", await page.evaluate(() => JSON.stringify(localStorage)));
  const bodyConfirmacion = await page.locator("body").innerText();
  console.log("7. body confirmacion:", bodyConfirmacion.slice(0, 1200));
  const dniMatch = bodyConfirmacion.match(/\b\d{8}\b/);
  console.log("7. DNI completo visible en confirmación?:", dniMatch ? dniMatch[0] : "no (bien)");
  const precioConfirmacion = bodyConfirmacion.match(/S\/\s*[\d.]+/g);
  console.log("7. precios en confirmacion:", precioConfirmacion);

  const descargarBtn = page.getByRole("button", { name: /Descargar boleto|Descargar PDF/i });
  if (await descargarBtn.count()) {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      descargarBtn.click({ force: true }),
    ]);
    console.log("8. descarga PDF nombre:", download.suggestedFilename());
  }
}

await browser.close();
console.log("--- consola acumulada ---");
consoleMsgs.forEach((m) => console.log(m));
