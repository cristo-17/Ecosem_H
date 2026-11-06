import { Card } from "@/components/ui/Card";
import type { PriceAuditResponse } from "@/lib/types/contratos-panel";
export function HistorialCambios({ historial }: {
  historial: PriceAuditResponse["changes"];
}) {
  return <Card className="space-y-4">
    <h2 className="text-base font-semibold text-navy">Historial del servidor</h2>
    <p className="text-sm text-text-secondary">Autor identificado por su userId real. Fecha y hora de Perú. Los valores anterior y posterior son los registros de auditoría del backend.</p>
    {!historial.length ? <p>No hay cambios registrados en el servidor.</p> : <div className="space-y-4">{historial.map((c, i) => <article key={`${c.recordId}-${c.changedAt}-${i}`} className="space-y-3 border-t border-border-default py-4">
      <p className="font-medium">{c.table === "tarifas_ruta" ? "Tarifa de ruta" : "Factor de precio"} · {c.recordId}</p>
      <p>Usuario: <span className="break-all">{c.userId}</span>
      </p>
      <time dateTime={c.changedAt}>{new Date(c.changedAt).toLocaleString("es-PE", { timeZone: "America/Lima", hour12: false })} · America/Lima</time>
      <div className="grid gap-4 sm:grid-cols-2">{([["Antes", c.before], ["Después", c.after]] as const).map(([titulo, valor]) => <div key={titulo}>
        <h3 className="font-medium">{titulo}</h3>
        {valor === null ? <p>Sin registro</p> : <dl className="space-y-2">{Object.entries(valor).map(([campo, dato]) => <div key={campo} className="flex flex-wrap justify-between gap-3 text-sm">
          <dt className="text-text-secondary">{campo}</dt>
          <dd className="break-all">{dato === null ? "Sin valor" : typeof dato === "object" ? JSON.stringify(dato) : String(dato)}</dd>
        </div>)}</dl>}
      </div>)}</div>
    </article>)}</div>}
  </Card>;
}
