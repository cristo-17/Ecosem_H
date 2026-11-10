import Link from "next/link";
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
import flota01 from "@/public/images/nosotros/flota-01.jpg";
import flota02 from "@/public/images/nosotros/flota-02.png";
import flota03 from "@/public/images/nosotros/flota-03.png";
import personal01 from "@/public/images/nosotros/personal-01.png";

export const metadata: Metadata = {
  title: "Nosotros — Ecosem H",
  description:
    "Misión, visión, historia y flota de Ecosem H: transporte interprovincial de pasajeros entre Lima, Cerro de Pasco y Huancayo.",
};

// Los imports verifican existencia y extraen dimensiones al compilar.
const galeria: FleetSlide[] = [
  { filename: "flota-01.jpg", alt: "Bus de la flota de Ecosem H", dimensiones: flota01 },
  { filename: "flota-02.png", alt: "Interior de un bus de Ecosem H", dimensiones: flota02 },
  { filename: "flota-03.png", alt: "Bus de Ecosem H en terminal", dimensiones: flota03 },
  { filename: "personal-01.png", alt: "Personal de Ecosem H", dimensiones: personal01 },
];

export default function NosotrosPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-navy px-4 py-8 text-white sm:py-10">
        <div className="relative mx-auto max-w-3xl">
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
          Ecosem H se constituyó jurídicamente en{" "}
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
              <ScaleIcon className="!size-5 !text-text-faint" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy">
                También ofrecemos servicio industrial y minero
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
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
