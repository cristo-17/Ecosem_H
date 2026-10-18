import { ConfirmacionView } from "./ConfirmacionView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ConfirmacionPage(props: PageProps<"/pasajes/comprar/confirmacion">) {
  const searchParams = await props.searchParams;
  // La reserva va en la URL (un UUID, sin datos personales): sin ella no hay
  // compra que mostrar.
  return <ConfirmacionView reservationId={primerValor(searchParams.reserva) ?? ""} />;
}
