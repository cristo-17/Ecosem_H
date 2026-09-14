import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import {
  FleetCarousel,
  type FleetSlide,
} from "@/components/nosotros/FleetCarousel";
import { BuscarPasajesCta } from "@/components/nosotros/BuscarPasajesCta";
import {
  FlagIcon,
  EyeIcon,
  SeatIcon,
  BoxIcon,
  SteeringWheelIcon,
  ScaleIcon,
} from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Nosotros — Ecosem H",
  description:
    "Misión, visión, historia y flota de Ecosem H: transporte interprovincial de pasajeros entre Lima, Cerro de Pasco y Huancayo.",
};

const GALERIA: Omit<FleetSlide, "exists">[] = [
  { filename: "flota-01.jpg", alt: "Bus de la flota de Ecosem H" },
  { filename: "flota-02.jpg", alt: "Interior de un bus de Ecosem H" },
  { filename: "flota-03.png", alt: "Bus de Ecosem H en terminal" },
  { filename: "personal-01.png", alt: "Personal de Ecosem H" },
];

// Chequeo en el servidor (build/request), no onError de next/image en
// cliente: con imágenes locales en public/ ese evento no es confiable para
// decidir si el archivo existe.
function archivoExiste(filename: string): boolean {
  const ruta = path.join(
    process.cwd(),
    "public",
    "images",
    "nosotros",
    filename,
  );
  return fs.existsSync(ruta);
}

export default function NosotrosPage() {
  const galeria: FleetSlide[] = GALERIA.map((slide) => ({
    ...slide,
    exists: archivoExiste(slide.filename),
  }));
  const encabezadoTieneImagen = archivoExiste("header-bg.jpg");

  return (
    <main>
      <section className="relative overflow-hidden bg-navy px-4 py-8 text-white sm:py-10">
        {encabezadoTieneImagen && (
          <>
            <Image
              src="/images/nosotros/header-bg.jpg"
              alt="Flota de Ecosem H"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/*
              navy/75, no el navy/50 del scrim de Modal: ese 50% está pensado
              para atenuar contenido detrás de un modal, no para garantizar
              contraste de texto. El H1 (texto grande, negrita) necesita 3:1
              AA incluso si la foto tiene zonas muy claras detrás del texto;
              con /50 ese peor caso no lo cumple.
            */}
            <div aria-hidden="true" className="absolute inset-0 bg-navy/75" />
          </>
        )}
        <div className="relative mx-auto max-w-3xl">
          {/*
            white/80 (no white/60): el breadcrumb original usaba /60 sobre
            navy sólido, donde sí pasaba AA. Sobre una foto con overlay ese
            margen se reduce, así que se sube a /80 en ambos casos (con y sin
            imagen) para no bifurcar el estilo del encabezado.
          */}
          <nav
            aria-label="Ruta de navegación"
            className="text-sm text-white/80"
          >
            <ol className="flex items-center gap-1.5">
              <li>
                <Link
                  href={RUTAS.inicio}
                  className="transition hover:text-white"
                >
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-white">
                Nosotros
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Conoce Ecosem H
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="transition duration-200 hover:shadow-medium">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary/10">
              <FlagIcon />
            </span>
            <h2 className="mt-3 text-base font-semibold text-navy">Misión</h2>
            <p className="mt-2 text-sm text-navy/70">
              Brindar un excelente servicio a nuestros clientes para el mejor
              servicio de transporte de pasajeros y de carga, con seguridad,
              calidad, rapidez y puntualidad; que permita proporcionar un
              ambiente agradable.
            </p>
          </Card>

          <Card className="transition duration-200 hover:shadow-medium">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary/10">
              <EyeIcon />
            </span>
            <h2 className="mt-3 text-base font-semibold text-navy">Visión</h2>
            <p className="mt-2 text-sm text-navy/70">
              Ser la empresa líder en el transporte de pasajeros, carga y
              alquiler de equipos en la zona centro del país, destacando por la
              calidad del servicio, la innovación constante y el compromiso con
              nuestros clientes.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-2">
        <h2 className="text-lg font-semibold text-navy sm:text-xl">
          Nuestra historia
        </h2>
        <p className="mt-3 text-sm text-navy/70 sm:text-base">
          ECOSEM H se constituyó jurídicamente en{" "}
          <strong className="font-semibold text-navy">noviembre de 2015</strong>{" "}
          bajo la razón social EMPCOSEM S.A., e inició operaciones con esa razón
          social en{" "}
          <strong className="font-semibold text-navy">abril de 2016</strong>.
          Desde entonces, nuestra actividad principal es el transporte
          interprovincial de pasajeros en las rutas Cerro de Pasco – Lima y
          Huancayo – Lima, con una flota moderna, asientos tipo sofá cama y
          climatización.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-lg font-semibold text-navy sm:text-xl">
          Nuestra flota y equipo
        </h2>
        <div className="mt-4">
          <FleetCarousel slides={galeria} />
        </div>
      </section>

      <section className="bg-white px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-lg font-semibold text-navy sm:text-xl">
            Qué hacemos
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4">
            <li className="flex flex-col items-center gap-1.5 text-center">
              <SeatIcon className="!size-8" />
              <span className="text-sm font-medium text-navy/70">
                Pasajes interprovinciales
              </span>
            </li>
            <li className="flex flex-col items-center gap-1.5 text-center">
              <BoxIcon className="!size-8" />
              <span className="text-sm font-medium text-navy/70">
                Encomiendas
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-surface-base px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
            Información institucional — no se vende desde esta plataforma
          </p>
          <div className="mt-2 flex items-start gap-3">
            <div className="mt-0.5 flex items-center gap-1.5">
              <SteeringWheelIcon />
              <ScaleIcon className="!size-5 !text-navy/40" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy">
                También ofrecemos servicio industrial y minero
              </h3>
              <p className="mt-1 text-sm text-navy/60">
                Traslado de personal minero e industrial, transporte de carga
                pesada y peligrosa, y servicios logísticos con izaje de camiones
                grúa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 text-center">
        <BuscarPasajesCta />
      </section>
    </main>
  );
}
