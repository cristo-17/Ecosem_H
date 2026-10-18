import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.screenshot({ path: ".qa-tmp/shots/fold-check-360.png" });
const info = await page.evaluate(() => {
  const heroSearch = document.querySelector("form") ?? document.querySelector("main");
  const rect = heroSearch?.getBoundingClientRect();
  return { rect, innerHeight: window.innerHeight };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
