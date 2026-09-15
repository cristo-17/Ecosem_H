import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AccordionItem } from "@/components/ui/Accordion";
import { RUTAS } from "@/lib/routes";
import { CATEGORIAS_FAQ } from "./preguntasFrecuentes";

export function AyudaView() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Ayuda</h1>
      <p className="mt-2 text-sm text-navy/70">
        Preguntas frecuentes sobre pasajes, encomiendas, equipaje, pagos y tu cuenta. Si tu
        consulta no está acá, escríbenos o pasa por counter.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {CATEGORIAS_FAQ.map((categoria) => (
          <section key={categoria.id}>
            <h2 className="text-base font-semibold text-navy">{categoria.titulo}</h2>
            <Card className="mt-3 py-0">
              {categoria.preguntas.map((pregunta, indice) => (
                <AccordionItem key={pregunta.id} pregunta={pregunta.pregunta} defaultOpen={indice === 0}>
                  {pregunta.respuesta}
                </AccordionItem>
              ))}
            </Card>
          </section>
        ))}
      </div>

      <Card className="mt-8 flex flex-col gap-2">
        <h2 className="text-base font-semibold text-navy">¿No encontraste tu respuesta?</h2>
        <p className="text-sm text-navy/70">
          Escríbenos a{" "}
          <a href="mailto:contacto@ecosemh.pe" className="text-secondary underline">
            contacto@ecosemh.pe
          </a>{" "}
          o llámanos al{" "}
          <a href="tel:+51987654321" className="text-secondary underline">
            987 654 321
          </a>
          . Si es un reclamo o una queja formal, tienes a disposición el{" "}
          <Link href={RUTAS.libroReclamaciones} className="text-secondary underline">
            Libro de Reclamaciones
          </Link>
          .
        </p>
      </Card>
    </main>
  );
}
