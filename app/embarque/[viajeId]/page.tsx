import { EscaneoView } from "./EscaneoView";

export default async function EmbarqueEscaneoPage(props: PageProps<"/embarque/[viajeId]">) {
  const { viajeId } = await props.params;

  return <EscaneoView viajeId={viajeId} />;
}
