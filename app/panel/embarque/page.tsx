import { EmbarqueView } from "./EmbarqueView";

export default async function PanelEmbarquePage({ searchParams }: { searchParams: Promise<{ viajeId?: string | string[] }> }) {
  const params = await searchParams;
  const viajeId = typeof params.viajeId === "string" ? params.viajeId : undefined;
  return <EmbarqueView viajeId={viajeId} />;
}
