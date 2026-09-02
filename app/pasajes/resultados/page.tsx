import { esCiudad } from "@/lib/mock/viajes";
import { ResultadosView } from "./ResultadosView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ResultadosPasajesPage(props: PageProps<"/pasajes/resultados">) {
  const searchParams = await props.searchParams;

  const origenParam = primerValor(searchParams.origen);
  const destinoParam = primerValor(searchParams.destino);

  const origen = esCiudad(origenParam) ? origenParam : "Lima";
  const destino = esCiudad(destinoParam) ? destinoParam : "Huancayo";
  const forzarError = primerValor(searchParams.error) === "1";
  const pasajerosParam = Number(primerValor(searchParams.pasajeros));
  const pasajerosCount = Number.isInteger(pasajerosParam) && pasajerosParam > 0 ? pasajerosParam : 1;

  return (
    <ResultadosView
      key={`${origen}-${destino}-${forzarError}`}
      origen={origen}
      destino={destino}
      forzarError={forzarError}
      pasajerosCount={pasajerosCount}
    />
  );
}
