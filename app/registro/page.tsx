import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { rutaInterna } from "@/lib/auth/rutas";
import { RUTAS } from "@/lib/routes";
import { RegistroView } from "./RegistroView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function RegistroPage(props: PageProps<"/registro">) {
  const searchParams = await props.searchParams;
  const siguiente = rutaInterna(primerValor(searchParams.siguiente), RUTAS.miPerfil);
  if (await obtenerSesion()) redirect(siguiente);
  return <RegistroView siguiente={siguiente} />;
}
