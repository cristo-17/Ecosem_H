import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "supervisor", domain: "localhost", path: "/" },
]);
const page = await context.newPage();
await page.goto("http://localhost:3000/panel/precios", { waitUntil: "networkidle" });

await page.getByLabel("Ocupación actual (%)").fill("98");
await page.getByLabel("Días de anticipación").fill("0");
await page.waitForTimeout(200);
const texto1 = await page.locator("body").innerText();
const idx = texto1.indexOf("Simulador");
console.log("--- ocupacion alta / anticipacion 0 ---");
console.log(texto1.slice(idx, idx + 1200));

await page.getByLabel("Ocupación actual (%)").fill("150");
await page.waitForTimeout(200);
const texto2 = await page.locator("body").innerText();
console.log("--- ocupacion invalida (150) ---");
console.log(texto2.slice(texto2.indexOf("Simulador"), texto2.indexOf("Simulador") + 800));

await browser.close();
