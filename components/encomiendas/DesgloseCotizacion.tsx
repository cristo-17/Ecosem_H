import { formatPrecio } from "@/lib/format";
import type { ParcelQuote as Cotizacion } from "@/lib/types/contratos-panel";
export function DesgloseCotizacion({ cotizacion }: {
  cotizacion: Cotizacion;
}) {
  const filas: Array<[
    string,
    string
  ]> = [
      ["Peso real", `${cotizacion.realWeightKg} kg`],
      ...(cotizacion.volumetricWeightKg
        ? ([[`Peso volumétrico (÷ ${cotizacion.volumetricDivisor})`, `${cotizacion.volumetricWeightKg} kg`]] as Array<[
          string,
          string
        ]>)
        : []),
      [
        `Peso facturable (por ${cotizacion.billedBy === "real" ? "peso real" : "volumen"})`,
        `${cotizacion.billableWeightKg} kg`,
      ],
      [
        `Rango ${cotizacion.range.fromKg}–${cotizacion.range.toKg} kg`,
        formatPrecio(Number(cotizacion.range.price)),
      ],
      ...(cotizacion.declaredValue
        ? ([[`Recargo ${cotizacion.surchargePercent ?? "0"}% sobre S/ ${cotizacion.declaredValue}`, formatPrecio(Number(cotizacion.surcharge))]] as Array<[
          string,
          string
        ]>)
        : []),
    ];
  return (<div className="space-y-3" data-testid="cotizacion-servidor">
    {cotizacion.fictitiousRate && <p className="rounded-md bg-warning-fill p-3 text-sm text-warning-text">Tarifa ficticia de prueba: no es un monto comercial aprobado.</p>}
    <dl className="flex flex-col gap-1 rounded-md bg-navy/5 p-4 text-sm">
      {filas.map(([etiqueta, valor]) => (<div key={etiqueta} className="flex justify-between gap-3">
        <dt className="text-navy/70">{etiqueta}</dt>
        <dd className="font-medium text-navy">{valor}</dd>
      </div>))}
      <div className="mt-1 flex justify-between gap-3 border-t border-navy/10 pt-2">
        <dt className="font-semibold text-navy">Total</dt>
        <dd className="text-base font-bold text-navy">{formatPrecio(Number(cotizacion.total))}</dd>
      </div>
    </dl>
  </div>);
}
