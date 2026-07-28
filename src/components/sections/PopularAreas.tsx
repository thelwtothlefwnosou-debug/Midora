import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { POPULAR_AREAS } from "@/lib/copy";
import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";

export async function PopularAreas() {
  const t = await getTranslations("Home");
  const featured = POPULAR_AREAS.filter((a) => "featured" in a && a.featured);
  const rest = POPULAR_AREAS.filter((a) => !("featured" in a && a.featured));

  return (
    <section id="areas" className="home-section home-section--editorial home-bg-cream scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader title={t("areasTitle")} subtitle={t("areasSubtitle")} />

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {featured.map((area) => (
            <Link
              key={area.city}
              href={`/listings?city=${encodeURIComponent(area.city)}`}
              className="home-city-featured group relative flex min-h-[11.5rem] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-[#f4efe7] px-6 py-6 sm:min-h-[13rem] sm:px-8 sm:py-8"
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-90"
                aria-hidden
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at 88% 18%, rgba(166,124,82,0.14), transparent 46%), linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(244,239,231,0.2) 55%)",
                }}
              />
              <span className="relative flex items-end justify-between gap-4">
                <span className="min-w-0">
                  <span className="block font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
                    {t(area.labelKey)}
                  </span>
                  <span className="mt-2 block max-w-sm text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                    {t(area.blurbKey)}
                  </span>
                </span>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-charcoal shadow-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-dark">
                  <ArrowUpRight className="h-5 w-5" strokeWidth={1.75} />
                </span>
              </span>
            </Link>
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {rest.map((area) => (
            <li key={area.city}>
              <Link
                href={`/listings?city=${encodeURIComponent(area.city)}`}
                className="home-city-tile group flex h-full min-h-[6.5rem] flex-col justify-between rounded-[1.25rem] bg-white/80 px-5 py-4 ring-1 ring-border/70 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_32px_-18px_rgba(26,26,26,0.22)] hover:ring-gold/25"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-xl font-semibold tracking-tight text-charcoal">
                    {t(area.labelKey)}
                  </span>
                  <ArrowUpRight
                    className="mt-1 h-4 w-4 shrink-0 text-muted/45 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="mt-3 text-sm leading-snug text-muted">{t(area.blurbKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
