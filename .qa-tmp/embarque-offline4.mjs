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
let encontrado = null;
for (const codigo of codigos) {
  await codigoInput.fill(codigo);
  await page.locator("button", { hasText: "Validar" }).click();
  await page.waitForTimeout(200);
  const texto = (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0];
  if (texto === "VÁLIDO") {
    encontrado = codigo;
    await page.screenshot({ path: ".qa-tmp/shots/embarque-07-offline-valido-real.png" });
    console.log("Encontrado código fresco:", codigo, "-> VÁLIDO (offline)");
    break;
  }
  await page.locator("button", { hasText: "Listo, siguiente" }).click();
}

if (!encontrado) {
  console.log("No se encontró ningún pasajero sin embarcar todavía (raro, revisar mock).");
} else {
  // repetir el mismo código offline -> debe dar YA EMBARCADO, offline
  await page.locator("button", { hasText: "Listo, siguiente" }).click();
  await codigoInput.fill(encontrado);
  await page.locator("button", { hasText: "Validar" }).click();
  await page.waitForTimeout(200);
  console.log("Repetido offline:", (await page.locator("body").innerText()).match(/VÁLIDO|INVÁLIDO|YA EMBARCADO/)?.[0]);
}

await browser.close();
