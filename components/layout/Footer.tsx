import Image from "next/image";
import Link from "next/link";
import { RUTAS } from "@/lib/routes";
import { FacebookIcon, InstagramIcon } from "@/components/ui/icons";

const REDES_SOCIALES = [
  {
    href: "https://www.facebook.com/ecosemh",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    href: "https://www.instagram.com/ecosemhh",
    label: "Instagram",
    Icon: InstagramIcon,
  },
];

const ENLACES_UTILES = [
  { href: RUTAS.inicio, label: "Comprar Pasajes" },
  { href: RUTAS.enviarEncomienda, label: "Enviar Encomienda" },
  { href: RUTAS.rastrearEncomienda, label: "Rastrear Encomienda" },
  { href: RUTAS.nosotros, label: "Nosotros" },
  { href: RUTAS.ayuda, label: "Ayuda" },
];

const TERMINALES = [
  { ciudad: "Lima", direccion: "Terminal Lima Norte, Av. Túpac Amaru 1234" },
  {
    ciudad: "Cerro de Pasco",
    direccion: "Terminal Cerro de Pasco, Jr. Vilcabamba 456",
  },
  {
    ciudad: "Huancayo",
    direccion: "Terminal Huancayo Centro, Av. Ferrocarril 789",
  },
];

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-4">Ecosem H</h2>
          <p className="mt-2 text-sm text-white/70">
            Transporte interprovincial entre Lima, Cerro de Pasco y Huancayo.
            Venta de pasajes y envío de encomiendas con seguimiento en línea.
          </p>
          <ul className="mt-4 flex gap-2">
            {REDES_SOCIALES.map((red) => (
              <li key={red.label}>
                <a
                  href={red.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={red.label}
                  className="flex size-11 items-center justify-center rounded-field text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <red.Icon />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white mb-4 pb-2 border-b border-white/20 inline-block">Enlaces</p>
          <ul className="flex flex-col space-y-3">
            {ENLACES_UTILES.map((enlace) => (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  className="text-sm text-white/70 hover:text-white transition-colors duration-200"
                >
                  {enlace.label}
                </Link>
              </li>
            ))}
          </ul>

          {/*
            Obligatorio por Ley 29571: debe apuntar a un formulario funcional,
            nunca a "#" (ver /libro-de-reclamaciones). Convención peruana: se
            accede con la imagen oficial del libro, no como ítem de texto del
            menú — por eso va separado del resto de la lista, como un sello.
          */}
          <Link
            href={RUTAS.libroReclamaciones}
            aria-label="Libro de Reclamaciones"
            className="mt-4 inline-flex w-fit items-center justify-center rounded-sm bg-white p-2 transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Image
              src="/images/libro-de-reclamaciones.png"
              alt="Libro de Reclamaciones"
              width={110}
              height={77}
              className="h-auto w-[110px]"
            />
          </Link>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white mb-4 pb-2 border-b border-white/20 inline-block">
            Contacto y Terminales
          </p>
          <ul className="flex flex-col space-y-3 text-sm text-white/70">
            {/*
              Celular peruano (9 dígitos): sin prefijo de fijo. "(01)" es el
              código de área de Lima para teléfonos fijos (7 dígitos) y no
              corresponde a este número.
            */}
            <li>
              <a
                href="tel:+51987654321"
                className="text-sm text-white/70 hover:text-white transition-colors duration-200"
              >
                987 654 321
              </a>
            </li>
            <li>
              <a
                href="mailto:contacto@ecosemh.pe"
                className="text-sm text-white/70 hover:text-white transition-colors duration-200"
              >
                contacto@ecosemh.pe
              </a>
            </li>
          </ul>
          <ul className="mt-4 flex flex-col space-y-3 text-sm text-white/70">
            {TERMINALES.map((terminal) => (
              <li key={terminal.ciudad}>
                <span className="font-medium text-white/90">
                  {terminal.ciudad}:
                </span>{" "}
                {terminal.direccion}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/10 px-4 py-4 text-center text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6">
        <p>© 2026 Ecosem H. Plataforma digital de pasajes y encomiendas.</p>        <div className="flex gap-4">
          <Link href={RUTAS.terminos} className="hover:text-white/80">
            Términos y Condiciones
          </Link>
          <Link href={RUTAS.privacidad} className="hover:text-white/80">
            Política de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
