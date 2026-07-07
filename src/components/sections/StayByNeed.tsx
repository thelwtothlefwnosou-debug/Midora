import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HOME_STAY_NEEDS } from "@/lib/homepage-content";
import { HomeIconBadge, HomeSectionHeader } from "@/components/sections/HomeSectionHeader";

export function StayByNeed() {
  return (
    <section id="needs" className="home-section home-bg-sand border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title="Βρες σπίτι ανάλογα με την ανάγκη σου"
          subtitle="Ξεκίνα από τον λόγο της διαμονής σου και βρες πιο γρήγορα το κατάλληλο ακίνητο."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_STAY_NEEDS.map((item) => (
            <Link
              key={item.stay}
              href={
                item.rentalType
                  ? `/listings?rentalType=${item.rentalType}`
                  : `/listings?stay=${item.stay}`
              }
              className="home-card home-card-lift group flex h-full min-h-[12rem] flex-col p-5 sm:min-h-[12.5rem] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <HomeIconBadge icon={item.icon} />
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-charcoal sm:text-[1.05rem]">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted/95">{item.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
