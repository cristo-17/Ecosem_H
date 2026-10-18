import { esFechaBusqueda, hoyEnPeru } from "@/lib/api/ventas";
import { AsientosView } from "./AsientosView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function AsientosPage(props: PageProps<"/pasajes/comprar/asientos">) {
  const searchParams = await props.searchParams;
  const viajeId = primerValor(searchParams.viajeId) ?? "";
  const pasajerosParam = Number(primerValor(searchParams.pasajeros));
  const pasajerosCount = Number.isInteger(pasajerosParam) && pasajerosParam > 0 ? pasajerosParam : 1;
  const fechaParam = primerValor(searchParams.fecha);

  return (
    <AsientosView
      viajeId={viajeId}
      pasajerosCount={pasajerosCount}
      origen={primerValor(searchParams.origen)?.trim() ?? ""}
      destino={primerValor(searchParams.destino)?.trim() ?? ""}
      fecha={esFechaBusqueda(fechaParam) ? fechaParam : hoyEnPeru()}
    />
  );
}
