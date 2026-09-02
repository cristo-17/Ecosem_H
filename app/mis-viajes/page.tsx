import { MisComprasView } from "./MisComprasView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function MisViajesPage(props: PageProps<"/mis-viajes">) {
  const searchParams = await props.searchParams;
  const forzarError = primerValor(searchParams.error) === "1";

  return <MisComprasView forzarError={forzarError} />;
}
