import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
]);
const page = await context.newPage();

await page.goto("http://localhost:3000/embarque", { waitUntil: "networkidle" });
await page.locator("button", { hasText: "Descargar" }).first().click();
await page.waitForURL(/\/embarque\/v1/, { timeout: 10000 });
await page.waitForTimeout(500);

await context.setOffline(true);
const codigoInput = page.locator('input[placeholder="ECH-XXXXXX"]');
await codigoInput.fill("ECH-D409C2");
await page.locator("button", { hasText: "Validar" }).click();
await page.waitForTimeout(300);
console.log("Resultado escaneo offline:", (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0]);
console.log("Header tras escaneo offline:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: ".qa-tmp/shots/embarque-08-header-offline-pendiente.png" });

await context.setOffline(false);
await page.evaluate(() => window.dispatchEvent(new Event("online")));
await page.waitForTimeout(2000);
console.log("Header tras reconectar (esperando auto-sync):", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: ".qa-tmp/shots/embarque-09-header-sincronizado.png" });

await browser.close();
