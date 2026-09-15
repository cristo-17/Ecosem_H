import { DetalleViajeView } from "./DetalleViajeView";

export default async function PanelViajeDetallePage(props: PageProps<"/panel/viajes/[id]">) {
  const { id } = await props.params;

  return <DetalleViajeView viajeId={id} />;
}
