import { UnidadDetalleView } from "./UnidadDetalleView";

export default async function PanelUnidadDetallePage(props: PageProps<"/panel/flota/[placa]">) {
  const { placa } = await props.params;

  return <UnidadDetalleView placa={placa} />;
}
