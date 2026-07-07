import Link from "next/link";

import { MapPin } from "lucide-react";

import { POPULAR_AREAS } from "@/lib/copy";

import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";



function DestinationCard({ city, label }: { city: string; label: string }) {

  return (

    <Link

      href={`/listings?city=${encodeURIComponent(city)}`}

      className="home-card home-card-lift group relative flex h-full min-h-[6.5rem] flex-col justify-end overflow-hidden px-4 py-4 sm:min-h-[7rem]"

    >

      <span

        className="pointer-events-none absolute inset-0 opacity-100"

        aria-hidden

        style={{

          backgroundImage:

            "radial-gradient(circle at 85% 20%, rgba(166,124,82,0.08), transparent 42%), linear-gradient(135deg, rgba(245,240,232,0.65) 0%, rgba(255,255,255,0.95) 55%)",

        }}

      />

      <span

        className="pointer-events-none absolute -right-3 -bottom-3 h-16 w-16 rounded-full border border-gold/10 bg-gold/[0.04]"

        aria-hidden

      />

      <span className="relative flex items-start gap-3">

        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white/80 transition-colors group-hover:border-gold/25 group-hover:bg-white">

          <MapPin className="h-4 w-4 text-gold/85" />

        </span>

        <span className="min-w-0 pt-0.5">

          <span className="block text-sm font-semibold text-charcoal">{label}</span>

          <span className="mt-1 block text-[11px] text-muted/85 transition-colors group-hover:text-gold-dark">

            Δες αγγελίες

          </span>

        </span>

      </span>

    </Link>

  );

}



export function PopularAreas() {

  const firstRow = POPULAR_AREAS.slice(0, 4);

  const secondRow = POPULAR_AREAS.slice(4);



  return (

    <section className="home-section home-bg-cream border-t border-border">

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <HomeSectionHeader

          title="Δημοφιλείς προορισμοί"

          subtitle="Ξεκίνα την αναζήτησή σου από δημοφιλείς πόλεις, νησιά και περιοχές."

        />



        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {firstRow.map((area) => (

            <DestinationCard key={area.city} city={area.city} label={area.label} />

          ))}

        </div>



        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mx-auto lg:max-w-[calc(75%-0.375rem)] lg:grid-cols-3">

          {secondRow.map((area) => (

            <DestinationCard key={area.city} city={area.city} label={area.label} />

          ))}

        </div>

      </div>

    </section>

  );

}

