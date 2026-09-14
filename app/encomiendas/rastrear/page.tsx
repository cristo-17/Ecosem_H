import { Suspense } from "react";
import { RastrearEncomiendaView } from "./RastrearEncomiendaView";

export default function RastrearEncomiendaPage() {
  return (
    <Suspense>
      <RastrearEncomiendaView />
    </Suspense>
  );
}
