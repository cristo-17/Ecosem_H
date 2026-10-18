import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 380, height: 820 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.getByText("Selecciona una fecha").first().click();
await page.waitForTimeout(200);

for (let i = 0; i < 18; i++) {
  const heading = await page.locator('[aria-label="Elegir fecha"] >> text=/^[A-Za-zé]+ \\d{4}$/').first().textContent().catch(() => null);
  const leadingBlanks = await page.evaluate(() => {
    const grid = document.querySelector('table, [role="grid"]');
    return null;
  });
  console.log(i, heading);
  await page.screenshot({ path: `.qa-tmp/shots/dp-${String(i).padStart(2, "0")}.png` });
  const next = page.locator('button[aria-label="Mes siguiente"]');
  await next.click();
  await page.waitForTimeout(100);
}
await browser.close();
