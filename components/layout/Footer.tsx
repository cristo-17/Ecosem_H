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
          <p className="text-lg font-semibold">Ecosem H</p>
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
          <p className="text-sm font-semibold text-white/90">Enlaces Útiles</p>
          <ul className="mt-3 flex flex-col gap-2">
            {ENLACES_UTILES.map((enlace) => (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  className="text-sm text-white/70 underline-offset-2 transition hover:text-white hover:underline"
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
          <p className="text-sm font-semibold text-white/90">
            Contacto y Terminales
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
            {/*
              Celular peruano (9 dígitos): sin prefijo de fijo. "(01)" es el
              código de área de Lima para teléfonos fijos (7 dígitos) y no
              corresponde a este número.
            */}
            <li>
              <a
                href="tel:+51987654321"
                className="transition hover:text-white hover:underline"
              >
                987 654 321
              </a>
            </li>
            <li>
              <a
                href="mailto:contacto@ecosemh.pe"
                className="transition hover:text-white hover:underline"
              >
                contacto@ecosemh.pe
              </a>
            </li>
          </ul>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/70">
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

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50 sm:px-6">
        © 2026 Ecosem H. Todos los derechos reservados.
      </div>
    </footer>
  );
}
