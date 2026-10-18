import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto("http://localhost:3000/styleguide", { waitUntil: "networkidle" });
const trigger = page.locator('button[role="combobox"][aria-haspopup="dialog"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(200);
const prevBtn = page.locator('button[aria-label="Mes anterior"]');
for (let i = 0; i < 10; i++) { await prevBtn.click(); await page.waitForTimeout(50); }
const rowCount = await page.locator('[role="dialog"] table tbody tr').count();
const lastRowText = await page.locator('[role="dialog"] table tbody tr').last().innerText();
const dialogBox = await page.locator('[role="dialog"]').boundingBox();
console.log(JSON.stringify({ rowCount, lastRowText, dialogBox }, null, 2));
await browser.close();
