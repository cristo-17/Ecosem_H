import { Card } from "@/components/ui/Card";
import { formatFechaCorta, formatHora12 } from "@/lib/format";
import type { CambioTarifa } from "@/lib/mock/precios";

export function HistorialCambios({ historial }: { historial: CambioTarifa[] }) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-navy">Historial de cambios</h2>
      <p className="mt-1 text-sm text-navy/70">
        Cada edición de tarifa o factor queda registrada con quién, cuándo y el valor anterior.
      </p>

      {historial.length === 0 ? (
        <p className="mt-4 text-sm text-navy/60">Todavía no se hizo ningún cambio en esta sesión.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-navy/60">
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Usuario</th>
                <th className="pb-2 font-medium">Campo</th>
                <th className="pb-2 font-medium">Valor anterior</th>
                <th className="pb-2 font-medium">Valor nuevo</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((cambio) => (
                <tr key={cambio.id} className="border-t border-navy/10">
                  <td className="py-2 whitespace-nowrap text-navy/70">
                    {formatFechaCorta(cambio.fecha)} {formatHora12(cambio.fecha)}
                  </td>
                  <td className="py-2 text-navy">{cambio.usuario}</td>
                  <td className="py-2 text-navy">{cambio.campo}</td>
                  <td className="py-2 text-navy/70">{cambio.valorAnterior}</td>
                  <td className="py-2 font-medium text-navy">{cambio.valorNuevo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
