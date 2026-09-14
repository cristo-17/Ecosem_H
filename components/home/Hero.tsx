import Image from "next/image";

export function Hero() {
  return (
    <section className="relative w-full overflow-visible bg-surface-base">
      {/* 1. Capa de Fondo (Background Layer) */}
      <div className="absolute top-0 left-0 w-full h-[350px] md:h-[400px] z-0">
        {/* 1. Imagen a tamaño original sin forzar zoom excesivo */}
        <Image
          src="/servicebanner.png"
          alt="Buses de Ecosem H"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        {/* 2. Overlay oscuro superior (para legibilidad del título) */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/30 to-transparent" />
        {/* 3. Desvanecimiento inferior suave (Fade to white) */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      </div>

      {/* 2. Capa de Contenido (Textos) */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col px-4 pt-16 pb-8 text-white md:pt-24">
        <h1 className="text-2xl font-bold sm:text-3xl text-center md:text-left">
          Viaja seguro por la sierra central
        </h1>
        <p className="mt-2 text-sm font-medium text-white/80 sm:text-base text-center md:text-left">
          Lima • Cerro de Pasco • Huancayo
        </p>
      </div>
    </section>
  );
}
