import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/styleguide", { waitUntil: "networkidle" });

const trigger = page.locator("button", { hasText: "Abrir registro de pasajero" });
await trigger.click();
await page.waitForTimeout(200);

const active1 = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 120));
console.log("focus tras abrir:", active1);

// Tab through many times, confirm focus stays within dialog
for (let i = 0; i < 10; i++) {
  await page.keyboard.press("Tab");
}
const stillInside = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  return dialog ? dialog.contains(document.activeElement) : null;
});
console.log("foco sigue dentro del dialog tras 10 Tabs:", stillInside);

// Shift+Tab many times too
for (let i = 0; i < 10; i++) {
  await page.keyboard.press("Shift+Tab");
}
const stillInside2 = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  return dialog ? dialog.contains(document.activeElement) : null;
});
console.log("foco sigue dentro tras Shift+Tab:", stillInside2);

await page.keyboard.press("Escape");
await page.waitForTimeout(200);
const active2 = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 120));
console.log("focus tras Escape (deberia ser el trigger):", active2);

await browser.close();
