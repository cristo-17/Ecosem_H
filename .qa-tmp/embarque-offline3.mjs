import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
]);
const page = await context.newPage();
const consoleMsgs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) consoleMsgs.push(`[${m.type()}] ${m.text().slice(0, 150)}`);
});
page.on("pageerror", (e) => consoleMsgs.push("[pageerror] " + String(e).slice(0, 200)));

await page.goto("http://localhost:3000/embarque", { waitUntil: "networkidle" });
await page.locator("button", { hasText: "Descargar" }).first().click();
await page.waitForURL(/\/embarque\/v1/, { timeout: 10000 });
await page.waitForTimeout(500);

// --- Desconectar la red (simula falta de cobertura en el andén) ---
await context.setOffline(true);
console.log("navigator.onLine tras setOffline:", await page.evaluate(() => navigator.onLine));

const codigoInput = page.locator('input[placeholder="ECH-XXXXXX"]');

// 1) Código válido, sin conexión
await codigoInput.fill("ECH-A04AD8");
await page.locator("button", { hasText: "Validar" }).click();
await page.waitForTimeout(300);
console.log("Resultado 1 (válido, offline):", (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0]);
await page.screenshot({ path: ".qa-tmp/shots/embarque-03-offline-valido.png" });
await page.locator("button", { hasText: "Listo, siguiente" }).click();

// 2) Mismo código otra vez -> ya embarcado, sin conexión
await codigoInput.fill("ECH-A04AD8");
await page.locator("button", { hasText: "Validar" }).click();
await page.waitForTimeout(300);
console.log("Resultado 2 (repetido, offline):", (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0]);
await page.screenshot({ path: ".qa-tmp/shots/embarque-04-offline-repetido.png" });
await page.locator("button", { hasText: "Listo, siguiente" }).click();

// 3) Código inválido, sin conexión
await codigoInput.fill("ECH-000000");
await page.locator("button", { hasText: "Validar" }).click();
await page.waitForTimeout(300);
console.log("Resultado 3 (inválido, offline):", (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0]);
await page.screenshot({ path: ".qa-tmp/shots/embarque-05-offline-invalido.png" });

// Contador embarcados/total mientras offline
console.log("Contador tras escaneos offline:", (await page.locator("body").innerText()).match(/\d+\/\d+/)?.[0]);

await page.locator("button", { hasText: "Listo, siguiente" }).click();

// --- Reconectar ---
await context.setOffline(false);
console.log("navigator.onLine tras reconectar:", await page.evaluate(() => navigator.onLine));
await page.evaluate(() => window.dispatchEvent(new Event("online")));
await page.waitForTimeout(1500);
await page.screenshot({ path: ".qa-tmp/shots/embarque-06-reconectado.png" });
console.log("Header tras reconectar:", (await page.locator("header").innerText()));

await browser.close();
console.log("--- consola acumulada ---");
consoleMsgs.forEach((m) => console.log(m));
