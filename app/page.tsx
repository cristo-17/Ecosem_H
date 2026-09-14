import { Hero } from "@/components/home/Hero";
import { SearchForm } from "@/components/home/SearchForm";
import { ServiceTabs } from "@/components/home/ServiceTabs";
import { TrustRow } from "@/components/home/TrustRow";

export default function Home() {
  return (
    <main>
      <Hero />

      {/* La tarjeta del buscador fluye naturalmente bajo los textos, y al
          tener la imagen del hero una altura del 85-90%, queda superpuesto
          a la zona inferior sin márgenes negativos problemáticos. */}
      <div className="relative z-10 mx-auto mt-8 w-full max-w-3xl px-4 md:mt-12">
        <div className="rounded-modal bg-white p-4 shadow-high sm:p-6">
          <SearchForm />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-10">
        <TrustRow />

        <div className="mt-6">
          <ServiceTabs />
        </div>
      </div>
    </main>
  );
}
