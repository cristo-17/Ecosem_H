"use client";
import { Card } from "@/components/ui/Card";
import { RUTAS_ENCOMIENDA, etiquetaRutaEncomienda } from "@/lib/mock/tarifario";
import { useTarifarioStore } from "@/lib/mock/tarifarioStore";
import { formatPrecio } from "@/lib/format";
/** Sin formularios ni callbacks de escritura mientras faltan los contratos del servicio. */
export function TarifarioView() {
  const { tarifario, escalonesEquipaje, porcentajeRecargoValorDeclarado } = useTarifarioStore();
  return <div className="space-y-6">
    <h1 className="text-xl font-semibold text-navy sm:text-2xl">Tarifario</h1>
    <div role="status" className="space-y-3 rounded-md bg-warning-fill p-4 text-warning-text">
      <p className="font-semibold">Pantalla todavía no conectada al backend. Edición y guardado no disponibles.</p>
      <p>Los datos de abajo son una referencia local y no representan el tarifario vigente. Los cambios locales no se aplican al cobro real. El counter consulta el tarifario del servidor.</p>
    </div>
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-navy">Encomiendas por ruta · referencia local</h2>
      {RUTAS_ENCOMIENDA.map(ruta => <Card key={ruta.id} className="space-y-3">
        <h3 className="font-semibold">{etiquetaRutaEncomienda(ruta)}</h3>
        {!tarifario.find(t => t.rutaId === ruta.id)?.rangos.length ? <p>Sin rangos locales. Consulta el tarifario vigente en counter.</p> : tarifario.find(t => t.rutaId === ruta.id)?.rangos.map(r => <p key={r.id}>Hasta {r.hastaKg} kg · {formatPrecio(r.precio)}</p>)}
      </Card>)}
    </section>
    <Card className="space-y-3">
      <h2 className="font-semibold">Exceso de equipaje · referencia local</h2>
      <p>Hasta 20 kg: franquicia incluida.</p>{escalonesEquipaje.map(e => <p key={e.id}>{e.etiqueta}: {e.recargo === null ? "Sin definir en esta referencia" : formatPrecio(e.recargo)}</p>)}</Card>
    <Card className="space-y-3">
      <h2 className="font-semibold">Recargo por valor declarado · referencia local</h2>
      <p>{porcentajeRecargoValorDeclarado === null ? "Sin definir en esta referencia" : `${porcentajeRecargoValorDeclarado}%`}</p>
    </Card>
  </div>;
}
