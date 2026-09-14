import { redirect } from "next/navigation";
import { RUTAS } from "@/lib/routes";

// El historial de viajes vive ahora dentro de /mi-perfil (pestaña "Mis
// viajes"), junto con el de encomiendas. Se mantiene esta ruta como
// redirección para no romper enlaces existentes que aún apunten acá.
export default function MisViajesPage() {
  redirect(RUTAS.miPerfil);
}
