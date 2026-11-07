import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayuda — Ecosem H",
  description: "Encuentra respuestas sobre la compra de pasajes, los pagos, el equipaje y los envíos de encomiendas de Ecosem H.",
};

import { AyudaView } from "./AyudaView";

export default function AyudaPage() {
  return <AyudaView />;
}
