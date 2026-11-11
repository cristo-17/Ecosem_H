import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// El código compartido conserva imports sin extensión para Next y el backend.
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "./qr" && context.parentURL?.endsWith("/lib/embarque/decidir.ts")) {
    return next(new URL("./qr.ts", context.parentURL).href, context);
  }
  return next(specifier, context);
} });
const { decidirEscaneo, impedimentoTemporal } = await import("../lib/embarque/decidir.ts");
const { validarReglaEmbarque } = await import("../lib/embarque/regla.ts");
const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
const tripId = "11111111-1111-4111-8111-111111111111";
const firmado = `EH1.qa.${tripId}.ECH-AABBCC.P1-1A`;
const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, pair.privateKey, new TextEncoder().encode(firmado));
const qr = `${firmado}.${Buffer.from(firma).toString("base64url")}`;
const paquete = {
  packageId: "22222222-2222-4222-8222-222222222222", boardingRuleVersion: "33333333-3333-4333-8333-333333333333",
  boardingOpensAt: "2026-11-11T14:00:00.000Z", boardingClosesAt: "2026-11-11T15:10:00.000Z",
  tripId, departsAt: "2026-11-11T15:00:00.000Z", status: "programado",
  issuedAt: "2026-11-11T12:00:00.000Z", validUntil: "2026-11-12T12:00:00.000Z",
  keys: [{ kid: "qa", publicKey, retired: false }], revoked: [], boarded: [], minors: [], infantsInArms: [],
};

test("la apertura y el cierre son inclusivos, con precisión de milisegundo", async () => {
  for (const [hora, esperado] of [
    ["2026-11-11T13:59:59.999Z", "embarque_no_abierto"],
    ["2026-11-11T14:00:00.000Z", "embarcar"],
    ["2026-11-11T14:00:00.001Z", "embarcar"],
    ["2026-11-11T15:10:00.000Z", "embarcar"],
    ["2026-11-11T15:10:00.001Z", "embarque_cerrado"],
    ["2026-11-12T10:00:00.000Z", "embarque_cerrado"],
  ]) {
    const decision = await decidirEscaneo(qr, paquete, [], new Date(hora));
    assert.equal(decision.tipo === "rechazado" ? decision.motivo : decision.tipo, esperado, hora);
  }
});

test("bloquea paquetes antiguos, sin regla, con fechas inválidas y relojes anteriores a la emisión", () => {
  const ahora = new Date("2026-11-11T14:30:00Z");
  for (const campo of ["packageId", "boardingRuleVersion", "boardingOpensAt", "boardingClosesAt"]) {
    const viejo = { ...paquete }; delete viejo[campo];
    assert(impedimentoTemporal(viejo, ahora), campo);
    assert(impedimentoTemporal({ ...paquete, [campo]: null }, ahora), campo);
  }
  assert.equal(impedimentoTemporal({ ...paquete, boardingRuleVersion: null, boardingOpensAt: null, boardingClosesAt: null }, ahora), "embarque_sin_configurar");
  assert.equal(impedimentoTemporal({ ...paquete, boardingOpensAt: "incorrecto" }, ahora), "paquete_incompleto");
  assert.equal(impedimentoTemporal({ ...paquete, boardingOpensAt: paquete.boardingClosesAt, boardingClosesAt: paquete.boardingOpensAt }, ahora), "paquete_incompleto");
  assert.equal(impedimentoTemporal(paquete, new Date("2026-11-11T11:59:59.999Z")), "incidencia_reloj");
  assert.equal(impedimentoTemporal(paquete, new Date("2026-11-12T12:00:00.001Z")), "paquete_vencido");
  assert.equal(impedimentoTemporal({ ...paquete, boardingClosesAt: paquete.validUntil }, new Date(paquete.validUntil)), null);
});

test("firma, viaje y anulación mantienen prioridad sobre la ventana", async () => {
  const ahora = new Date("2026-11-11T13:00:00Z");
  assert.equal((await decidirEscaneo(qr.replace("AABBCC", "AABBCD"), paquete, [], ahora)).motivo, "firma_invalida");
  assert.equal((await decidirEscaneo(qr, { ...paquete, tripId: "otro" }, [], ahora)).motivo, "otro_viaje");
  assert.equal((await decidirEscaneo(qr, { ...paquete, status: "cancelado" }, [], ahora)).motivo, "viaje_cancelado");
  assert.equal((await decidirEscaneo(qr, { ...paquete, revoked: [{ purchaseCode: "ECH-AABBCC", seat: "P1-1A" }] }, [], ahora)).motivo, "boleto_anulado");
  assert.equal((await decidirEscaneo(qr, { ...paquete, boarded: [{ purchaseCode: "ECH-AABBCC", seat: "P1-1A" }] }, [], new Date("2026-11-11T14:30:00Z"))).tipo, "ya-embarcado");
});

test("configuración sin valores predeterminados: cero válido, minutos enteros y fuente obligatoria", () => {
  assert.deepEqual(validarReglaEmbarque({ opensBeforeMinutes: "0", closesAfterMinutes: "0", source: "Decisión verificada" }), {});
  for (const valor of ["", "-1", "0.5", "1e2", "2147483648"]) {
    const errores = validarReglaEmbarque({ opensBeforeMinutes: valor, closesAfterMinutes: valor, source: " " });
    assert(errores.opensBeforeMinutes); assert(errores.closesAfterMinutes); assert(errores.source);
  }
});
