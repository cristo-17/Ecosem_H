import test from "node:test";
import assert from "node:assert/strict";
import { validarNombre, validarCorreo, validarContrasena, MENSAJES_VALIDACION } from "../lib/validacion.ts";

test("admite nombres de distintos alfabetos y separadores entre palabras", () => {
  for (const nombre of ["José Ñahui", "Müller", "O'Connor", "D’Ávila", "Anne-Marie", "李 明", "Ольга", "محمد", "मैत्रेयी", "Jose\u0301"]) {
    assert.equal(validarNombre(nombre), undefined, nombre);
  }
});

test("rechaza números, símbolos y separadores sin palabras a ambos lados", () => {
  for (const nombre of ["Ana1", "José@", "Ana--María", "Ana  María", "-Ana", "Ana-", "O''Connor", "Ana\nMaría", "\u0301Ana", "Ana_Lee", "Ana 😀"]) {
    assert.equal(validarNombre(nombre), MENSAJES_VALIDACION.nombre, nombre);
  }
  assert.equal(validarNombre(" "), MENSAJES_VALIDACION.obligatorio);
  assert.equal(validarNombre(null), MENSAJES_VALIDACION.obligatorio);
  assert.equal(validarNombre("a".repeat(101), 100), "Máximo 100 caracteres");
});

test("usa el patrón de correo solicitado y conserva el correo opcional", () => {
  for (const correo of ["a+b@example.com", "a.b_1%z@example-domain.pe", " X@EXAMPLE.COM "]) {
    assert.equal(validarCorreo(correo), undefined, correo);
  }
  for (const correo of ["a@b.c", "a@b.12", "a@@b.com", "a b@example.com", "ñ@example.com", "a@localhost"]) {
    assert.equal(validarCorreo(correo), MENSAJES_VALIDACION.correo, correo);
  }
  assert.equal(validarCorreo(""), MENSAJES_VALIDACION.obligatorio);
  assert.equal(validarCorreo("", false), undefined);
  assert.equal(validarCorreo("a@b.c", false), MENSAJES_VALIDACION.correo);
});

test("la contraseña requiere ocho caracteres sin añadir requisitos de composición", () => {
  assert.equal(validarContrasena("1234567"), MENSAJES_VALIDACION.contrasena);
  assert.equal(validarContrasena("12345678"), undefined);
  assert.equal(validarContrasena("abcdefgh"), undefined);
  assert.equal(validarContrasena(" 123456 "), undefined);
  assert.equal(validarContrasena("a".repeat(72)), undefined);
  assert.equal(validarContrasena("a".repeat(73)), MENSAJES_VALIDACION.contrasenaLarga);
  assert.equal(validarContrasena(null), MENSAJES_VALIDACION.contrasena);
});
