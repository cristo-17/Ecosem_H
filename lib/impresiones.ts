/** El número corresponde al registro de auditoría, incluida la impresión original. */
export function etiquetaImpresion(numero: number): string {
  return `${numero === 1 ? "Impresión original" : "Reimpresión"} n.º ${numero}`;
}

/** Fecha de auditoría: año-mes-día, reloj de 24 horas y zona explícita. */
export function fechaImpresion(fecha: string): string {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "America/Lima",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZoneName: "longOffset",
  }).formatToParts(new Date(fecha));
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find(p => p.type === tipo)?.value;
  const offset = valor("timeZoneName")?.replace("GMT", "UTC");
  return `${valor("year")}-${valor("month")}-${valor("day")} ${valor("hour")}:${valor("minute")}:${valor("second")} · America/Lima (${offset})`;
}
