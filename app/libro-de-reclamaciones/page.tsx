import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Libro de reclamaciones — Ecosem H",
  description: "Presenta un reclamo o una queja sobre los servicios de pasajes y encomiendas de Ecosem H.",
};

import { LibroDeReclamacionesView } from "./LibroDeReclamacionesView";

export default function LibroDeReclamacionesPage() {
  return <LibroDeReclamacionesView />;
}
