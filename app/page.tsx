import { Hero } from "@/components/home/Hero";
import { SearchForm } from "@/components/home/SearchForm";
import { ServiceTabs } from "@/components/home/ServiceTabs";
import { TrustRow } from "@/components/home/TrustRow";

export default function Home() {
  return (
    <main>
      <Hero />

      {/* La tarjeta del buscador se superpone al hero con un margen negativo. */}
      <div className="relative z-10 mx-auto -mt-16 w-full max-w-3xl px-4 sm:-mt-20">
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
