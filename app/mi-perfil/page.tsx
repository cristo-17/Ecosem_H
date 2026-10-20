import { PerfilView } from "./PerfilView";
import { exigirAcceso } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function MiPerfilPage(props: PageProps<"/mi-perfil">) {
  // Cualquier sesión verificada; sin ella, al ingreso y de vuelta aquí.
  const { sesion } = await exigirAcceso("sesion", RUTAS.miPerfil);

  const searchParams = await props.searchParams;
  const vacio = primerValor(searchParams.vacio);

  return (
    <PerfilView
      nombre={sesion.nombre}
      correo={sesion.correo}
      forzarViajesVacios={vacio === "viajes"}
    />
  );
}
