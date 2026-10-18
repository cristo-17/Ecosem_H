import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto("http://localhost:3000/styleguide", { waitUntil: "networkidle" });

const trigger = page.locator('button[role="combobox"][aria-haspopup="dialog"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(200);

const prevBtn = page.locator('button[aria-label="Mes anterior"]');
const nextBtn = page.locator('button[aria-label="Mes siguiente"]');

async function currentMonthLabel() {
  return page.locator('[role="dialog"] >> text=/.*[0-9]{4}.*/').first().textContent().catch(() => null);
}

// hoy = sept 2026. Noviembre 2025 empieza sabado (10 meses atras).
for (let i = 0; i < 10; i++) {
  await prevBtn.click();
  await page.waitForTimeout(50);
}
await page.locator('[role="dialog"]').screenshot({ path: ".qa-tmp/shots/reglas-datepicker-nov2025-sabado.png" });

// Febrero 2026 (3 meses adelante desde nov2025)
for (let i = 0; i < 3; i++) {
  await nextBtn.click();
  await page.waitForTimeout(50);
}
await page.locator('[role="dialog"]').screenshot({ path: ".qa-tmp/shots/reglas-datepicker-feb2026.png" });

await browser.close();
console.log("done");
