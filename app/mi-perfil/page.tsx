import { PerfilView } from "./PerfilView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function MiPerfilPage(props: PageProps<"/mi-perfil">) {
  const searchParams = await props.searchParams;
  const vacio = primerValor(searchParams.vacio);

  return (
    <PerfilView
      forzarViajesVacios={vacio === "viajes"}
      forzarEncomiendasVacias={vacio === "encomiendas"}
    />
  );
}
