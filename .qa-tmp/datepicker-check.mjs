import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

// Abrir el DatePicker de "Fecha de ida"
await page.getByText("Selecciona una fecha").first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: ".qa-tmp/shots/datepicker-01-abierto.png" });

// Navegar a febrero 2027 (empieza lunes) y a un mes que empiece sábado: agosto 2026 empieza sábado (1 ago 2026 es sábado)
// Busca el botón de "mes siguiente" varias veces
for (let i = 0; i < 6; i++) {
  const next = page.getByRole("button", { name: /mes siguiente|siguiente|›|>/i }).first();
  if (await next.count()) {
    await next.click();
    await page.waitForTimeout(100);
  }
}
await page.screenshot({ path: ".qa-tmp/shots/datepicker-02-navegado.png" });

const html = await page.locator("body").innerHTML();
console.log("longitud html:", html.length);
await browser.close();
