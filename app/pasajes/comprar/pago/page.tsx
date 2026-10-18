import { PagoView } from "./PagoView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PagoPage(props: PageProps<"/pasajes/comprar/pago">) {
  const searchParams = await props.searchParams;
  // La reserva va en la URL (un UUID, sin datos personales): sin ella no hay
  // compra que mostrar.
  return <PagoView reservationId={primerValor(searchParams.reserva) ?? ""} />;
}
