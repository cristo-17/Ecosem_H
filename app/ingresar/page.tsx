import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { rutaInterna } from "@/lib/auth/rutas";
import { RUTAS } from "@/lib/routes";
import { IngresarView } from "./IngresarView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function IngresarPage(props: PageProps<"/ingresar">) {
  const searchParams = await props.searchParams;
  // Solo rutas internas: "siguiente" no puede mandar al usuario a otro sitio.
  const siguiente = rutaInterna(primerValor(searchParams.siguiente), RUTAS.miPerfil);

  // Con la sesión viva (p. ej. una recarga), no hay nada que ingresar.
  if (await obtenerSesion()) redirect(siguiente);

  return (
    <IngresarView
      siguiente={siguiente}
      enlaceInvalido={primerValor(searchParams.enlace) === "invalido"}
      sesionVencida={primerValor(searchParams.motivo) === "sesion-vencida"}
    />
  );
}
