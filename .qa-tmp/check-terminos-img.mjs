import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
const failed = [];
page.on("requestfailed", (req) => failed.push(req.url() + " :: " + req.failure()?.errorText));
page.on("response", (res) => {
  if (res.status() >= 400) failed.push(res.url() + " -> " + res.status());
});
await page.goto("http://localhost:3000/terminos", { waitUntil: "networkidle" });
const imgs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("img")).map((img) => ({
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    alt: img.alt,
  }))
);
console.log(JSON.stringify(imgs, null, 2));
console.log("failed requests:", failed);
await browser.close();
