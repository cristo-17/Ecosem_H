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

const codigos = await page.evaluate(async () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ecosem-embarque");
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(["manifiestos"], "readonly");
      const getAll = tx.objectStore("manifiestos").getAll();
      getAll.onsuccess = () => resolve(getAll.result[0].pasajeros.map((p) => p.codigoBoleto));
      getAll.onerror = () => reject(getAll.error);
    };
    req.onerror = () => reject(req.error);
  });
});

await context.setOffline(true);
const codigoInput = page.locator('input[placeholder="ECH-XXXXXX"]');
let fresco = null;
for (const codigo of codigos) {
  await codigoInput.fill(codigo);
  await page.locator("button", { hasText: "Validar" }).click();
  await page.waitForTimeout(150);
  const texto = (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0];
  if (texto === "VÁLIDO") { fresco = codigo; break; }
  await page.locator("button", { hasText: "Listo, siguiente" }).click();
}
console.log("Código fresco usado:", fresco);
console.log("Header inmediatamente tras escaneo VÁLIDO offline:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: ".qa-tmp/shots/embarque-10-header-pendiente-real.png" });

await context.setOffline(false);
await page.evaluate(() => window.dispatchEvent(new Event("online")));
await page.waitForTimeout(2500);
console.log("Header tras reconectar:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: ".qa-tmp/shots/embarque-11-header-tras-sync.png" });

await browser.close();
