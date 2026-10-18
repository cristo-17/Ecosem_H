import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
]);
const page = await context.newPage();
await page.goto("http://localhost:3000/panel/venta", { waitUntil: "networkidle" });
await page.getByLabel("Origen").click();
await page.getByRole("option", { name: "Lima" }).click();
await page.getByLabel("Destino").click();
await page.getByRole("option", { name: "Huancayo" }).click();
const hoy = new Date();
await page.getByLabel("Fecha de viaje").click();
await page.locator(`button[data-date="${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}"]`).click();
await page.getByRole("button", { name: "Buscar" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Seleccionar" }).first().click();
await page.waitForTimeout(300);

// count how many TopBar-like elements exist in the DOM (hamburger+logo+person icon header)
const headerCount = await page.locator("header").count();
console.log("headers en el DOM:", headerCount);
const headerInfo = await page.evaluate(() => {
  return [...document.querySelectorAll("header")].map((h) => {
    const r = h.getBoundingClientRect();
    return { class: h.className.slice(0, 80), top: r.top, height: r.height, position: getComputedStyle(h).position };
  });
});
console.log(JSON.stringify(headerInfo, null, 2));

// scroll down to where seat map tabs are, take a normal (non fullPage) screenshot
await page.evaluate(() => window.scrollTo(0, 250));
await page.waitForTimeout(200);
await page.screenshot({ path: ".qa-tmp/shots-panel/scrolled-250.png" });
await page.evaluate(() => window.scrollTo(0, 450));
await page.waitForTimeout(200);
await page.screenshot({ path: ".qa-tmp/shots-panel/scrolled-450.png" });

await browser.close();
