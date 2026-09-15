import { ExclamationIcon } from "@/components/ui/icons";

export interface SeccionPendienteProps {
  titulo: string;
  descripcion: string;
}

/**
 * Encabezado de una sección legal + marcador de pendiente, en vez del
 * texto legal en sí (docs/prompts/14-ayuda-faq.md: "no redactar términos y
 * condiciones ni política de privacidad inventados"). La descripción es
 * neutral — qué cubrirá la sección, no cómo la resuelve — para no cruzar
 * la línea hacia redacción legal real.
 */
export function SeccionPendiente({ titulo, descripcion }: SeccionPendienteProps) {
  return (
    <section className="border-t border-navy/10 py-5 first:border-t-0 first:pt-0">
      <h2 className="text-base font-semibold text-navy">{titulo}</h2>
      <p className="mt-1 text-sm text-navy/70">{descripcion}</p>
      <div className="mt-3 flex items-start gap-2 rounded-md bg-warning-fill p-3 text-sm text-warning-text">
        <ExclamationIcon className="mt-0.5 !size-5 shrink-0" />
        <p>Pendiente de redacción legal. Todavía no fue revisado ni aprobado por el área legal.</p>
      </div>
    </section>
  );
}
