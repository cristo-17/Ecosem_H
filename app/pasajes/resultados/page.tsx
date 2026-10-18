import { redirect } from "next/navigation";
import { esFechaBusqueda, hoyEnPeru } from "@/lib/api/ventas";
import { RUTAS } from "@/lib/routes";
import { ResultadosView } from "./ResultadosView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ResultadosPasajesPage(props: PageProps<"/pasajes/resultados">) {
  const searchParams = await props.searchParams;

  const origenParam = primerValor(searchParams.origen);
  const destinoParam = primerValor(searchParams.destino);
  const fechaParam = primerValor(searchParams.fecha);

  // Las ciudades no se validan contra una lista fija: la búsqueda las cruza
  // con el catálogo del backend, y si no hay ruta lo dice. Sin origen o
  // destino no hay nada que buscar.
  const origen = origenParam?.trim();
  const destino = destinoParam?.trim();
  if (!origen || !destino) redirect(RUTAS.inicio);
  // Sin fecha (p. ej. desde Rutas populares) se busca hoy, hora de Perú.
  const fecha = esFechaBusqueda(fechaParam) ? fechaParam : hoyEnPeru();
  const pasajerosParam = Number(primerValor(searchParams.pasajeros));
  const pasajerosCount = Number.isInteger(pasajerosParam) && pasajerosParam > 0 ? pasajerosParam : 1;

  return (
    <ResultadosView
      key={`${origen}-${destino}-${fecha}`}
      origen={origen}
      destino={destino}
      fecha={fecha}
      pasajerosCount={pasajerosCount}
    />
  );
}
