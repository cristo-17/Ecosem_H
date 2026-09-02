import { PagoView } from "./PagoView";

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PagoPage(props: PageProps<"/pasajes/comprar/pago">) {
  const searchParams = await props.searchParams;
  // Sin pasarela real todavía: para probar el rechazo de pago sin depender
  // de una tarjeta de prueba, ?simular=error fuerza esa rama. Mismo patrón
  // que ?error=1 en /pasajes/resultados.
  const simularError = primerValor(searchParams.simular) === "error";

  return <PagoView simularError={simularError} />;
}
