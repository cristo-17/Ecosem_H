import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enviar encomienda — Ecosem H",
  description: "Cotiza tu envío de encomiendas con Ecosem H: elige las agencias de origen y destino e indica el peso y las medidas de tu paquete.",
};

import { EnviarEncomiendaView } from "./EnviarEncomiendaView";

export default function EnviarEncomiendaPage() {
  return <EnviarEncomiendaView />;
}
