import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectShowcase } from "./SelectShowcase";
import { DatePickerShowcase } from "./DatePickerShowcase";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ModalShowcase } from "./ModalShowcase";
import { ToastShowcase } from "./ToastShowcase";
import { Stepper } from "@/components/ui/Stepper";
import { EncomiendaTimeline } from "@/components/ui/EncomiendaTimeline";
import { EmptyStateShowcase } from "./EmptyStateShowcase";

const BADGE_STATUSES: BadgeStatus[] = [
  "confirmado",
  "pendiente",
  "cancelado",
  "en-ruta",
  "completado",
];

const BUTTON_VARIANTS: { key: ButtonVariant; label: string }[] = [
  { key: "principal", label: "Principal" },
  { key: "secundario", label: "Secundario" },
  { key: "terciario", label: "Terciario" },
  { key: "destructivo", label: "Destructivo" },
];

// :hover y :active no se pueden forzar sin interacción real del cursor, así
// que estas columnas replican con ! (important) el mismo valor que Button
// aplica en esos estados, solo para que la grilla se vea completa de un
// vistazo. Los botones siguen siendo interactivos: pasar el cursor o
// mantener presionado cualquiera de ellos confirma el estado real.
const HOVER_PREVIEW: Record<ButtonVariant, string> = {
  principal: "brightness-95!",
  secundario: "brightness-95!",
  terciario: "bg-navy/5!",
  destructivo: "bg-primary/5!",
};
const PRESSED_PREVIEW: Record<ButtonVariant, string> = {
  principal: "brightness-85!",
  secundario: "brightness-85!",
  terciario: "bg-navy/15!",
  destructivo: "bg-primary/15!",
};

// Styleguide interno: verifica visualmente los tokens de app/globals.css contra
// .claude/skills/ecosem-design-system/SKILL.md. No es una pantalla del producto.
export default function Styleguide() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-navy">Ecosem H — styleguide</h1>
      <p className="max-w-sm text-navy">
        Su compra ha sido <strong>finalizado</strong> con confianza. Verificando tildes: viajé,
        camión, Huancayo, Cerro de Pasco. Verificando ñ: mañana, año.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-field bg-primary px-4 py-2 text-sm font-medium text-white shadow-low">
          primary
        </span>
        <span className="rounded-field bg-secondary px-4 py-2 text-sm font-medium text-white shadow-low">
          secondary
        </span>
        <span className="rounded-field bg-navy px-4 py-2 text-sm font-medium text-white shadow-low">
          navy
        </span>
        <span className="rounded-field bg-skeleton px-4 py-2 text-sm font-medium text-navy shadow-low">
          skeleton
        </span>
        <span className="rounded-field bg-success-fill px-4 py-2 text-sm font-medium text-white shadow-low">
          success fill
        </span>
        <span className="rounded-field bg-warning-fill px-4 py-2 text-sm font-medium text-warning-fill-foreground shadow-low">
          warning fill
        </span>
        <span className="rounded-field bg-error-fill px-4 py-2 text-sm font-medium text-white shadow-low">
          error fill
        </span>
        <span className="rounded-field bg-info-fill px-4 py-2 text-sm font-medium text-white shadow-low">
          info fill
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
        <span className="text-success-text">Confirmado</span>
        <span className="text-warning-text">Sólo 4 asientos</span>
        <span className="text-error-text">Pago rechazado</span>
        <span className="text-info-text">Nuevo horario</span>
      </div>
      <div className="rounded-modal bg-white p-6 shadow-high">radius modal + shadow high</div>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Button</h2>
        <p className="mt-1 text-sm text-navy/70">
          4 tipos × 5 estados. Hover y pressed están forzados para verse en la
          grilla, pero cada botón sigue siendo real: pasa el cursor o
          mantenlo presionado para confirmarlo.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-3">
            <thead>
              <tr className="text-sm font-medium text-navy/70">
                <th className="pb-2 text-left">Tipo</th>
                <th className="pb-2 text-left">Default</th>
                <th className="pb-2 text-left">Hover</th>
                <th className="pb-2 text-left">Pressed</th>
                <th className="pb-2 text-left">Disabled</th>
                <th className="pb-2 text-left">Loading</th>
              </tr>
            </thead>
            <tbody>
              {BUTTON_VARIANTS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="text-sm font-medium text-navy">{label}</td>
                  <td>
                    <Button variant={key}>Continuar</Button>
                  </td>
                  <td>
                    <Button variant={key} className={HOVER_PREVIEW[key]}>
                      Continuar
                    </Button>
                  </td>
                  <td>
                    <Button variant={key} className={PRESSED_PREVIEW[key]}>
                      Continuar
                    </Button>
                  </td>
                  <td>
                    <Button variant={key} disabled>
                      Continuar
                    </Button>
                  </td>
                  <td>
                    <Button variant={key} isLoading>
                      Continuar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-navy">
          Confirmación de compra — principal junto a destructivo
        </h3>
        <p className="mt-1 text-sm text-navy/70">
          Fondo blanco sólido + borde en destructivo, relleno en principal:
          la diferencia es la forma del botón, no el tono de rojo.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-modal bg-navy/5 p-4">
          <Button variant="destructivo">Cancelar</Button>
          <Button variant="principal">Sí, Reservar</Button>
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Input</h2>
        <p className="mt-1 text-sm text-navy/70">
          Estados: normal, en foco, error, bloqueado. El foco de la grilla
          está forzado para verse sin interacción; el campo real reacciona
          igual al hacer clic o tabular hasta él.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Normal" placeholder="Escribe aquí" />
          <Input
            label="En foco"
            placeholder="Escribe aquí"
            className="border-secondary! outline-2! outline-offset-2! outline-secondary!"
          />
          <Input
            label="Error"
            defaultValue="12345"
            errorText="Este campo es obligatorio"
          />
          <Input label="Bloqueado" locked defaultValue="Lima" />
        </div>

        <h3 className="mt-6 text-sm font-semibold text-navy">
          Textos de ayuda predefinidos
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Documento de identidad"
            placeholder="DNI"
            helperText="Ingrese tal como figura en su DNI"
          />
          <Input
            label="Número celular"
            placeholder="987654321"
            inputMode="numeric"
            helperText="Debe contener exactamente 9 dígitos"
          />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Select</h2>
        <p className="mt-1 text-sm text-navy/70">
          Cerrado y abierto, con la opción actual marcada con check. Error y
          bloqueado reutilizan los mismos estados que Input.
        </p>
        <div className="mt-4">
          <SelectShowcase />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">DatePicker</h2>
        <p className="mt-1 text-sm text-navy/70">
          Disparador compacto (&quot;Jueves, 12 de Marzo&quot;) + calendario
          expandido con días en español. El indicador de hoy (anillo) y el de
          fecha seleccionada (relleno) son distintos a propósito.
        </p>
        <div className="mt-4">
          <DatePickerShowcase />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Badge</h2>
        <p className="mt-1 text-sm text-navy/70">
          Placas de estado, mismas en pasajes y encomiendas. &quot;Completado&quot;
          usa navy: no tiene color semántico propio en el skill, se trata como
          estado final/archivado en vez de inventar un tono.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {BADGE_STATUSES.map((status) => (
            <Badge key={status} status={status} />
          ))}
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Card</h2>
        <p className="mt-1 text-sm text-navy/70">
          Contenedor con elevación. La segunda simula el estado
          &quot;seleccionada&quot;: borde de color + elevación mayor.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-medium text-navy">Elevación baja (reposo)</p>
            <p className="mt-1 text-sm text-navy/70">shadow-low, sin borde.</p>
          </Card>
          <Card elevation="high" className="border-2 border-secondary">
            <p className="text-sm font-medium text-navy">Seleccionada</p>
            <p className="mt-1 text-sm text-navy/70">shadow-high + borde secondary.</p>
          </Card>
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Skeleton</h2>
        <p className="mt-1 text-sm text-navy/70">
          Tres variantes: bloque de tarjeta, líneas de texto y botón. Cada una
          anuncia &quot;Cargando&quot; a lectores de pantalla vía role=&quot;status&quot;.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Tarjeta</p>
            <Skeleton variant="card" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Texto</p>
            <Skeleton variant="text" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Botón</p>
            <Skeleton variant="button" />
          </div>
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Modal</h2>
        <p className="mt-1 text-sm text-navy/70">
          Dos usos: confirmación (Cancelar destructivo + Confirmar principal)
          y formulario embebido. Escape y clic en el fondo cierran; Tab queda
          atrapado dentro mientras está abierto y el foco vuelve al botón que
          lo abrió al cerrar.
        </p>
        <div className="mt-4">
          <ModalShowcase />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Toast</h2>
        <p className="mt-1 text-sm text-navy/70">
          Los 4 tipos del skill. Autocierre ~5s (pausa con cursor o foco);
          error no autocierra. Éxito/informativo se anuncian con
          aria-live=&quot;polite&quot;, advertencia/error con &quot;assertive&quot;.
        </p>
        <div className="mt-4">
          <ToastShowcase />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">Stepper</h2>
        <p className="mt-1 text-sm text-navy/70">
          Cuatro pasos fijos: Búsqueda → Selección → Datos → Pago. Completados
          marcados, activo destacado, pendientes atenuados.
        </p>
        <div className="mt-6 flex flex-col gap-6">
          <Stepper currentStep={1} />
          <Stepper currentStep={3} />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">EncomiendaTimeline</h2>
        <p className="mt-1 text-sm text-navy/70">
          Cuatro etapas fijas del ciclo de vida de una encomienda. Cumplido:
          punto relleno. Actual: punto más grande con relleno + anillo (mismo
          recurso que el anillo/relleno de DatePicker), etiqueta en negrita y
          el Badge de estado junto al punto. Pendiente: punto vacío con
          borde.
        </p>
        <div className="mt-4 max-w-sm">
          <EncomiendaTimeline
            etapaActual="en-camino"
            estadoBadge="en-ruta"
            eventos={[
              {
                estado: "registrada",
                terminal: "Terminal Lima Norte",
                fecha: new Date(2026, 7, 29, 9, 0),
              },
              {
                estado: "alistando",
                terminal: "Terminal Lima Norte",
                fecha: new Date(2026, 7, 29, 11, 30),
              },
              {
                estado: "en-camino",
                terminal: "Terminal Lima Norte",
                fecha: new Date(2026, 7, 30, 6, 0),
              },
            ]}
          />
        </div>
      </section>

      <section className="w-full max-w-4xl text-left">
        <h2 className="text-xl font-semibold text-navy">EmptyState</h2>
        <p className="mt-1 text-sm text-navy/70">
          Ícono, título, texto que sugiere qué cambiar, y acción secundaria
          que vuelve al paso anterior. Nunca una lista vacía sin salida.
        </p>
        <div className="mt-4">
          <EmptyStateShowcase />
        </div>
      </section>
    </main>
  );
}
