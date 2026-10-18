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
  if (["error", "warning"].includes(m.type())) consoleMsgs.push(`[${m.type()}] ${m.text().slice(0, 200)}`);
});
page.on("pageerror", (e) => consoleMsgs.push("[pageerror] " + String(e).slice(0, 300)));

await page.goto("http://localhost:3000/embarque", { waitUntil: "networkidle" });

// Primer botón "Descargar" = viaje v1 (56 pasajeros, 5:30 AM)
const primerDescargar = page.locator("button", { hasText: "Descargar" }).first();
await primerDescargar.click();
await page.waitForURL(/\/embarque\/v1/, { timeout: 10000 });
await page.waitForTimeout(500);
console.log("URL tras descargar:", page.url());

// Sacar un codigoBoleto real desde IndexedDB para probar el flujo
const codigos = await page.evaluate(async () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ecosem-embarque");
    req.onsuccess = () => {
      const db = req.result;
      const storeNames = Array.from(db.objectStoreNames);
      const tx = db.transaction(storeNames, "readonly");
      const out = {};
      let pending = storeNames.length;
      storeNames.forEach((name) => {
        const store = tx.objectStore(name);
        const getAll = store.getAll();
        getAll.onsuccess = () => {
          out[name] = getAll.result;
          pending--;
          if (pending === 0) resolve(out);
        };
      });
    };
    req.onerror = () => reject(req.error);
  });
});
console.log("Object stores:", Object.keys(codigos));
const manifiestos = codigos.manifiestos || codigos[Object.keys(codigos)[0]];
console.log(JSON.stringify(manifiestos, null, 2).slice(0, 1500));

await page.screenshot({ path: ".qa-tmp/shots/embarque-02-escaneo-online.png" });

await browser.close();
if (consoleMsgs.length) {
  console.log("--- consola ---");
  consoleMsgs.forEach((m) => console.log(m));
}
