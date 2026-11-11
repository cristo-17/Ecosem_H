// Comprobación posterior al despliegue. Solo invoca las rutas GET documentadas.
// GET paquete emite y persiste un paquete; no cambia reglas ni registra embarques.
import assert from "node:assert/strict";

const origen = process.env.ECOSEM_SUPABASE_URL;
const token = process.env.ECOSEM_EMBARQUE_TOKEN;
const viajeId = process.env.ECOSEM_EMBARQUE_VIAJE_ID;
if (!origen || !token || !viajeId) {
  throw new Error("Define ECOSEM_SUPABASE_URL, ECOSEM_EMBARQUE_TOKEN (supervisor activo) y ECOSEM_EMBARQUE_VIAJE_ID de un viaje autorizado de preview.");
}
const base = `${origen.replace(/\/$/, "")}/functions/v1/ventas`;
async function consultar(ruta) {
  const respuesta = await fetch(`${base}${ruta}`, {
    headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
  });
  if (!respuesta.ok) throw new Error(`La consulta de embarque respondió HTTP ${respuesta.status}. Revisa despliegue, sesión y permisos.`);
  return respuesta.json();
}
const { rule } = await consultar("/v1/configuracion/embarque");
assert(rule, "Ventana de embarque sin configurar: un supervisor debe guardar minutos y fuente reales antes de continuar.");
assert(Number.isInteger(rule.opensBeforeMinutes) && rule.opensBeforeMinutes >= 0);
assert(Number.isInteger(rule.closesAfterMinutes) && rule.closesAfterMinutes >= 0);
assert(typeof rule.source === "string" && rule.source.trim());
assert(rule.version && rule.updatedBy && Number.isFinite(Date.parse(rule.updatedAt)));
const paquete = await consultar(`/v1/embarque/viajes/${encodeURIComponent(viajeId)}/paquete`);
assert.equal(paquete.tripId, viajeId);
assert(paquete.packageId);
assert.equal(paquete.boardingRuleVersion, rule.version, "La regla cambió entre consultas: repite la verificación con configuración estable.");
assert.equal(Date.parse(paquete.boardingOpensAt), Date.parse(paquete.departsAt) - rule.opensBeforeMinutes * 60000);
assert.equal(Date.parse(paquete.boardingClosesAt), Date.parse(paquete.departsAt) + rule.closesAfterMinutes * 60000);
assert(Date.parse(paquete.validUntil) >= Date.parse(paquete.issuedAt));
assert(Array.isArray(paquete.keys));
for (const clave of paquete.keys) {
  assert.equal(clave.publicKey.kty, "EC"); assert.equal(clave.publicKey.crv, "P-256");
  assert(!("d" in clave.publicKey), "El paquete no debe incluir claves privadas");
}
let offset = 0;
let total = 0;
const visitados = new Set();
do {
  assert(!visitados.has(offset), "La paginación repite un offset"); visitados.add(offset);
  const pagina = await consultar(`/v1/embarque/viajes/${encodeURIComponent(viajeId)}/rechazados?offset=${offset}`);
  assert.equal(pagina.tripId, viajeId); assert(Array.isArray(pagina.scans)); assert(pagina.scans.length <= 100);
  for (const scan of pagina.scans) {
    for (const campo of ["scanId", "packageId", "purchaseCode", "seat", "reason", "scannedAt", "receivedAt", "operatorId", "boardingRuleVersion", "boardingOpensAt", "boardingClosesAt"]) assert(campo in scan, `Falta ${campo} en una incidencia`);
    assert(!("qr" in scan), "La consulta no debe exponer el QR");
  }
  total += pagina.scans.length;
  offset = pagina.nextOffset;
  assert(offset === null || (Number.isInteger(offset) && offset >= 0));
} while (offset !== null);
console.log(JSON.stringify({ regla: "OK", paqueteConVentana: "OK", clavesPublicas: "OK", consultaPaginada: "OK", incidenciasConsultadas: total }));
