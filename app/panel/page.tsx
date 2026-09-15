import { redirect } from "next/navigation";
import { RUTAS } from "@/lib/routes";

// Única sección del panel en esta rama por ahora: entrar a /panel manda
// directo a /panel/viajes en vez de mostrar un índice de una sola tarjeta.
export default function PanelIndexPage() {
  redirect(RUTAS.panelViajes);
}
