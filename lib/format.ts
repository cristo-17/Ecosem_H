/**
 * Utilidades de formato compartidas por componentes de viajes/encomiendas.
 * Formato de hora forzado a "AM"/"PM" en mayúsculas: el Intl de es-PE
 * devuelve "a. m."/"p. m." (con espacios y puntos), que no cumple el
 * formato pedido por el skill de diseño.
 */

export function formatHora12(date: Date): string {
  const horas = date.getHours();
  const minutos = date.getMinutes();
  const periodo = horas >= 12 ? "PM" : "AM";
  const hora12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${hora12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

export function formatDuracion(totalMinutos: number): string {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return minutos === 0 ? `${horas}h` : `${horas}h ${minutos}min`;
}

export function formatPrecio(soles: number): string {
  return `S/ ${soles.toFixed(2)}`;
}

function capitalize(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Formato largo del skill: "Lunes, 15 de Septiembre". */
export function formatFechaLarga(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" })
    .formatToParts(date)
    .map((parte) => (parte.type === "weekday" || parte.type === "month" ? capitalize(parte.value) : parte.value))
    .join("");
}

/** día/mes/año corto, para listas donde no cabe el formato largo. */
export function formatFechaCorta(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
