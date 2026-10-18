import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const SHOTS = path.resolve(import.meta.dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];

const ROLE_COOKIES = {
  invitado: [],
  pasajero: [{ name: "ecosem_sesion", value: "activa" }],
  counter: [
    { name: "ecosem_sesion", value: "activa" },
    { name: "ecosem_rol_demo", value: "counter" },
  ],
  supervisor: [
    { name: "ecosem_sesion", value: "activa" },
    { name: "ecosem_rol_demo", value: "supervisor" },
  ],
};

function cookiesFor(role) {
  return ROLE_COOKIES[role].map((c) => ({
    ...c,
    domain: "localhost",
    path: "/",
  }));
}

const ROUTES = [
  { path: "/", role: "invitado", label: "home-invitado" },
  { path: "/", role: "pasajero", label: "home-pasajero" },
  { path: "/nosotros", role: "invitado", label: "nosotros" },
  { path: "/pasajes/resultados", role: "invitado", label: "resultados" },
  { path: "/pasajes/resultados?error=1", role: "invitado", label: "resultados-error" },
  { path: "/encomiendas/enviar", role: "invitado", label: "encomiendas-enviar" },
  { path: "/encomiendas/rastrear", role: "invitado", label: "encomiendas-rastrear" },
  { path: "/ingresar", role: "invitado", label: "ingresar" },
  { path: "/registro", role: "invitado", label: "registro" },
  { path: "/recuperar-clave", role: "invitado", label: "recuperar-clave" },
  { path: "/libro-de-reclamaciones", role: "invitado", label: "libro-reclamaciones" },
  { path: "/ayuda", role: "invitado", label: "ayuda" },
  { path: "/terminos", role: "invitado", label: "terminos" },
  { path: "/privacidad", role: "invitado", label: "privacidad" },
  { path: "/mi-perfil", role: "invitado", label: "mi-perfil-sin-sesion" },
  { path: "/mi-perfil", role: "pasajero", label: "mi-perfil-con-sesion" },
  { path: "/mis-viajes", role: "invitado", label: "mis-viajes-sin-sesion" },
  { path: "/mis-viajes", role: "pasajero", label: "mis-viajes-con-sesion" },
  { path: "/panel", role: "invitado", label: "panel-sin-acceso" },
  { path: "/panel", role: "pasajero", label: "panel-rol-pasajero" },
  { path: "/panel", role: "counter", label: "panel-counter" },
  { path: "/panel", role: "supervisor", label: "panel-supervisor" },
  { path: "/panel/venta", role: "counter", label: "panel-venta" },
  { path: "/panel/caja", role: "counter", label: "panel-caja" },
  { path: "/panel/viajes", role: "counter", label: "panel-viajes" },
  { path: "/panel/viajes/v1", role: "counter", label: "panel-viajes-v1-lleno" },
  { path: "/panel/viajes/v4", role: "counter", label: "panel-viajes-v4-vip" },
  { path: "/panel/precios", role: "counter", label: "panel-precios-como-counter" },
  { path: "/panel/precios", role: "supervisor", label: "panel-precios" },
  { path: "/panel/tarifario", role: "supervisor", label: "panel-tarifario" },
  { path: "/panel/flota", role: "supervisor", label: "panel-flota" },
  { path: "/panel/flota/AGX-921", role: "supervisor", label: "panel-flota-placa" },
  { path: "/panel/conductores", role: "supervisor", label: "panel-conductores" },
  { path: "/panel/alertas", role: "supervisor", label: "panel-alertas" },
  { path: "/embarque", role: "counter", label: "embarque-elegir-viaje" },
  { path: "/ruta-que-no-existe-123", role: "invitado", label: "ruta-404" },
];

const results = [];

async function run() {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const cookies = cookiesFor(route.role);
      if (cookies.length) await context.addCookies(cookies);
      const page = await context.newPage();

      const consoleMsgs = [];
      page.on("console", (msg) => {
        if (["error", "warning"].includes(msg.type())) {
          consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
        }
      });
      const pageErrors = [];
      page.on("pageerror", (err) => pageErrors.push(String(err)));

      let httpStatus = null;
      let overflow = null;
      let title = null;
      let errorMsg = null;
      try {
        const resp = await page.goto(BASE + route.path, { waitUntil: "networkidle", timeout: 20000 });
        httpStatus = resp ? resp.status() : null;
        await page.waitForTimeout(300);
        title = await page.title();
        overflow = await page.evaluate(() => ({
          docScrollW: document.documentElement.scrollWidth,
          docClientW: document.documentElement.clientWidth,
          bodyScrollW: document.body.scrollWidth,
          bodyClientW: document.body.clientWidth,
        }));
        const shotPath = path.join(SHOTS, `${vp.name}__${route.role}__${route.label}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch (e) {
        errorMsg = String(e).slice(0, 300);
      }

      results.push({
        viewport: vp.name,
        role: route.role,
        path: route.path,
        label: route.label,
        httpStatus,
        title,
        overflowX:
          overflow && (overflow.docScrollW > overflow.docClientW + 1 || overflow.bodyScrollW > overflow.bodyClientW + 1),
        overflow,
        consoleMsgs,
        pageErrors,
        errorMsg,
      });

      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.resolve(import.meta.dirname, "resultados.json"), JSON.stringify(results, null, 2));
  console.log("DONE", results.length, "casos");
}

run();
