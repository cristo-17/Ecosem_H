import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const targets = [
  { path: "/", cookies: [] },
  { path: "/pasajes/resultados", cookies: [] },
  { path: "/panel/alertas", cookies: [{ name: "ecosem_sesion", value: "activa" }, { name: "ecosem_rol_demo", value: "supervisor" }] },
  { path: "/embarque", cookies: [{ name: "ecosem_sesion", value: "activa" }, { name: "ecosem_rol_demo", value: "counter" }] },
];

const browser = await chromium.launch();
const report = {};
for (const t of targets) {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  if (t.cookies.length) await context.addCookies(t.cookies.map(c => ({ ...c, domain: "localhost", path: "/" })));
  const page = await context.newPage();
  await page.goto(BASE + t.path, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  report[t.path] = results.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 3).map(n => n.target),
  }));
  await context.close();
}
await browser.close();
fs.writeFileSync(".qa-tmp/axe-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
