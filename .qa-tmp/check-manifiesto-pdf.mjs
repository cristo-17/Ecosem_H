import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import path from "node:path";

const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
]);
const page = await context.newPage();

for (const id of ["v1", "v4"]) {
  await page.goto(`http://localhost:3000/panel/viajes/${id}`, { waitUntil: "networkidle" });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /generar manifiesto/i }).click(),
  ]);
  const savePath = path.resolve(import.meta.dirname, `manifiesto-${id}.pdf`);
  await download.saveAs(savePath);
  const bytes = await import("node:fs").then((fs) => fs.readFileSync(savePath));
  const pdf = await PDFDocument.load(bytes);
  console.log(id, "paginas:", pdf.getPageCount(), "tamaño primera pagina:", pdf.getPage(0).getSize());
}

await browser.close();
