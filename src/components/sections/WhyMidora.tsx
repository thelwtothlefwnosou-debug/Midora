import { getTranslations } from "next-intl/server";
import { HOME_WHY_MIDORA } from "@/lib/homepage-content";
import { HomeSectionHeader } from "@/components/sections/HomeSectionHeader";

const WHY_KEYS = [
  { title: "why1Title", text: "why1Text" },
  { title: "why2Title", text: "why2Text" },
  { title: "why3Title", text: "why3Text" },
] as const;

export async function WhyMidora() {
  const t = await getTranslations("Home");

  return (
    <section id="trust" className="home-section home-section--editorial home-bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader title={t("whyTitle")} centered />

        <div className="mx-auto grid max-w-5xl gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-8">
          {HOME_WHY_MIDORA.map((card, i) => {
            const keys = WHY_KEYS[i];
            const Icon = card.icon;
            return (
              <article key={keys.title} className="text-center lg:text-left">
                <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-gold shadow-[0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-border/70 lg:mx-0">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-charcoal sm:text-xl">
                  {t(keys.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                  {t(keys.text)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
