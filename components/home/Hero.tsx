import Image from "next/image";

export function Hero() {
  return (
    <section className="relative w-full overflow-visible bg-surface-base">
      <div className="absolute top-0 left-0 w-full h-[360px] sm:h-[400px] md:h-[460px] z-0">
        <Image
          src="/banner-panoramico.png"
          alt="Buses de Ecosem H"
          fill
          priority
          sizes="100vw"
          quality={100}
          className="object-cover object-[72%_70%] md:object-[center_72%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/30 to-transparent" />
        <div className="absolute -bottom-px left-0 right-0 h-[40%] bg-gradient-to-t from-surface-base via-surface-base/75 to-transparent pointer-events-none" />
      </div>

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
