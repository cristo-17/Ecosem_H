import { DatosView } from "./DatosView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function DatosPage(props: PageProps<"/pasajes/comprar/datos">) {
  const searchParams = await props.searchParams;
  // La reserva va en la URL (un UUID, sin datos personales): sin ella no hay
  // compra que mostrar.
  return <DatosView reservationId={primerValor(searchParams.reserva) ?? ""} />;
}
