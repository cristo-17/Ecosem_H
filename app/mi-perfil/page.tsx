import { redirect } from "next/navigation";
import { PerfilView } from "./PerfilView";
import { haySesionActiva } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function MiPerfilPage(props: PageProps<"/mi-perfil">) {
  if (!(await haySesionActiva())) {
    redirect(RUTAS.ingresar);
  }

  const searchParams = await props.searchParams;
  const vacio = primerValor(searchParams.vacio);

  return (
    <PerfilView
      forzarViajesVacios={vacio === "viajes"}
      forzarEncomiendasVacias={vacio === "encomiendas"}
    />
  );
}
