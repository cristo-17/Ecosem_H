import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
]);
const page = await context.newPage();
await page.goto("http://localhost:3000/embarque", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Descargar/i }).nth(1).click();
await page.waitForURL(/\/embarque\/.+/, { timeout: 10000 });
await page.waitForTimeout(500);
const codigo = await page.evaluate(async () => {
  const req = indexedDB.open("ecosem-embarque", 1);
  const db = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  const tx = db.transaction(["manifiestos", "escaneos"], "readonly");
  const man = await new Promise((res) => { const r = tx.objectStore("manifiestos").get("v2"); r.onsuccess = () => res(r.result); });
  const esc = await new Promise((res) => { const r = tx.objectStore("escaneos").getAll(); r.onsuccess = () => res(r.result); });
  db.close();
  const codes = new Set(esc.filter(e => e.viajeId === "v2").map(e => e.codigoBoleto));
  return man.pasajeros.find(p => codes.has(p.codigoBoleto))?.codigoBoleto;
});
console.log("codigo ya-embarcado sembrado:", codigo);
const input = page.getByLabel("Código de reserva");
await input.fill(codigo);
await input.press("Enter");
await page.waitForTimeout(500);
await page.screenshot({ path: ".qa-tmp/shots/embarque-verify-sembrado.png" });
const texto = await page.getByText(/YA EMBARCADO|VÁLIDO|INVÁLIDO/).first().textContent();
console.log("banner:", texto);
await browser.close();
