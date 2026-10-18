import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
await context.addCookies([
  { name: "ecosem_sesion", value: "activa", domain: "localhost", path: "/" },
  { name: "ecosem_rol_demo", value: "counter", domain: "localhost", path: "/" },
]);
const page = await context.newPage();
const consoleMsgs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) consoleMsgs.push(`[${m.type()}] ${m.text().slice(0, 200)}`);
});
page.on("pageerror", (e) => consoleMsgs.push("[pageerror] " + String(e).slice(0, 300)));

await page.goto("http://localhost:3000/embarque", { waitUntil: "networkidle" });
await page.screenshot({ path: ".qa-tmp/shots/embarque-01-lista.png" });

// Elegir el viaje v1 (bus lleno) - busca su tarjeta y hace click en "Descargar"/seleccionar.
const tarjetas = await page.locator("button", { hasText: /Descargar|Ingresar|Seleccionar/i }).all();
console.log("botones candidatos:", tarjetas.length);

// Buscar el texto del viaje v1 (Terminal / hora) - imprimir el HTML de la lista para depurar
const bodyText = await page.locator("body").innerText();
console.log("--- contenido pagina seleccion ---");
console.log(bodyText.slice(0, 1500));

await browser.close();
