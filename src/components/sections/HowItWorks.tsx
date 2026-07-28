import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HOME_HOW_EDITORIAL_IMAGE, HOME_HOW_IT_WORKS } from "@/lib/homepage-content";

const HOW_KEYS = [
  { title: "how1Title", text: "how1Text" },
  { title: "how2Title", text: "how2Text" },
  { title: "how3Title", text: "how3Text" },
] as const;

export async function HowItWorks() {
  const t = await getTranslations("Home");

  return (
    <section
      id="explore"
      className="home-section home-section--editorial home-bg-white scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[34rem]">
            <Image
              src={HOME_HOW_EDITORIAL_IMAGE}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover object-[50%_40%]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent"
              aria-hidden
            />
          </div>

          <div>
            <h2 className="font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-charcoal sm:text-[2.25rem] lg:text-[2.5rem]">
              {t("howTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {t("howSubtitle")}
            </p>

            <ol className="mt-9 space-y-7 sm:mt-10 sm:space-y-8">
              {HOME_HOW_IT_WORKS.map((step, i) => {
                const keys = HOW_KEYS[i];
                const Icon = step.icon;
                return (
                  <li key={keys.title} className="flex gap-4 sm:gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal text-[13px] font-semibold tracking-wide text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className="h-4 w-4 shrink-0 text-gold"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <h3 className="font-display text-lg font-semibold text-charcoal sm:text-xl">
                          {t(keys.title)}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                        {t(keys.text)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="mt-8 text-sm text-muted/90 sm:mt-9">{t("howNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
