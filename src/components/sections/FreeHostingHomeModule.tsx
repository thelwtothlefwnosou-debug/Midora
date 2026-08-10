import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import {
  FREE_HOSTING_OWNER_OFFER_HREF,
  FREE_STAYS_PATH,
  getActiveFreeHostingOffers,
} from "@/lib/free-hosting";
import { FreeHostingMark } from "@/components/brand/FreeHostingMark";
import {
  FreeHostingVisualPanel,
  toCompactFreeHostingOffers,
} from "@/components/brand/FreeHostingVisualPanel";
import { formatDateKeyDisplay } from "@/lib/availability-calendar";

/**
 * Homepage Point A — after Featured listings, before StayByNeed.
 * Signature 55/45 composition; never shows fake listing cards.
 */
export async function FreeHostingHomeModule() {
  const t = await getTranslations("Home.freeHosting");
  const locale = await getLocale();
  const offers = await getActiveFreeHostingOffers(3);
  const compact = toCompactFreeHostingOffers(offers, (start, endExclusive) =>
    `${formatDateKeyDisplay(start, locale)} → ${formatDateKeyDisplay(endExclusive, locale)}`
  );

  return (
    <section
      id="free-hosting"
      aria-labelledby="free-hosting-heading"
      className="home-section home-section--editorial home-bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-charcoal/8 bg-gradient-to-br from-[#fbf8f3] via-white to-sand/60">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch">
            <div className="relative px-5 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14 xl:px-14">
              <div className="flex items-center gap-2.5">
                <FreeHostingMark className="h-6 w-6" />
                <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
                  {t("eyebrow")}
                </p>
              </div>
              <h2
                id="free-hosting-heading"
                className="mt-3 max-w-xl font-display text-[1.85rem] font-semibold leading-[1.1] tracking-tight text-charcoal sm:text-[2.35rem] lg:text-[2.55rem]"
              >
                {t("title")}
              </h2>
              <p className="mt-4 max-w-lg text-[0.975rem] leading-relaxed text-muted sm:text-base">
                {t("subtitle")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={FREE_STAYS_PATH} className="home-btn-primary">
                  <FreeHostingMark className="h-4 w-4 text-white" />
                  {t("primaryCta")}
                </Link>
                <Link href={FREE_HOSTING_OWNER_OFFER_HREF} className="home-btn-secondary">
                  {t("secondaryCta")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted/90">
                {t("clarity")}
              </p>
            </div>

            <div className="border-t border-charcoal/6 p-4 sm:p-5 lg:border-t-0 lg:border-l lg:bg-[#f7f1e8]/40 lg:p-5 xl:p-6">
              <FreeHostingVisualPanel
                offers={compact}
                emptyLabel={t("visualEmpty")}
                className="h-full min-h-[240px] lg:min-h-[340px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
