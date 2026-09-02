import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy px-4 pt-10 pb-24 text-white sm:pt-14 sm:pb-32">
      {/* 1. La imagen de fondo ocupando todo el contenedor */}
      <Image
        src="/servicebanner.png"
        alt="Buses de Ecosem H"
        fill
        priority /* priority es vital en Next.js para imágenes hero (Above the fold) para que cargue rápido */
        className="object-cover"
      />

      {/* 2. El degradado superpuesto (Overlay). 
          Lo hacemos semi-transparente (/80 y /60) para que la foto se vea, 
          pero oscureciéndola lo suficiente para que el texto blanco sea legible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-primary/60"
      />

      {/* 3. El contenido de texto (debe tener relative para flotar sobre la imagen y el overlay) */}
      <div className="relative mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Viaja seguro por la sierra central
        </h1>
        <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
          Lima • Cerro de Pasco • Huancayo
        </p>
      </div>
    </section>
  );
}
