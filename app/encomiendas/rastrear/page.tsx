import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastrear encomienda — Ecosem H",
  description: "Consulta el estado de tu encomienda de Ecosem H con el código de seguimiento de tu envío.",
};

import { Suspense } from "react";
import { RastrearEncomiendaView } from "./RastrearEncomiendaView";

export default function RastrearEncomiendaPage() {
  return (
    <Suspense>
      <RastrearEncomiendaView />
    </Suspense>
  );
}
