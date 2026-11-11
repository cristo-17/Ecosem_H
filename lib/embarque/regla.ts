import type { BoardingRulesRequest } from "../types/contratos-panel";

export interface BorradorReglaEmbarque {
  opensBeforeMinutes: string;
  closesAfterMinutes: string;
  source: string;
}

export function validarReglaEmbarque(datos: BorradorReglaEmbarque) {
  const errores: Partial<Record<keyof BoardingRulesRequest, string>> = {};
  for (const campo of ["opensBeforeMinutes", "closesAfterMinutes"] as const) {
    const valor = datos[campo].trim();
    if (!valor) errores[campo] = "Este campo es obligatorio";
    else if (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor))) errores[campo] = "Ingresa un número entero de minutos mayor o igual a cero";
    // Límite técnico de integer en PostgreSQL; no es un máximo operativo.
    else if (Number(valor) > 2147483647) errores[campo] = "Supera el límite técnico del servidor (2147483647 minutos)";
  }
  if (!datos.source.trim()) errores.source = "Indica el documento o la decisión operativa que respalda la regla";
  return errores;
}
