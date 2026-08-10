import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, HeartHandshake } from "lucide-react";
import {
  FREE_HOSTING_OWNER_OFFER_HREF,
  FREE_STAYS_PATH,
  getActiveFreeHostingOffers,
} from "@/lib/free-hosting";

/**
 * Homepage Point A — after Featured listings, before StayByNeed.
 * Informational + discovery; never shows fake listing cards.
 */
export async function FreeHostingHomeModule() {
  const t = await getTranslations("Home.freeHosting");
  const offers = await getActiveFreeHostingOffers(3);
  const hasOffers = offers.length > 0;

  return (
    <section
      id="free-hosting"
      aria-labelledby="free-hosting-heading"
      className="home-section home-section--editorial home-bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-charcoal/8 bg-gradient-to-br from-[#fbf8f3] via-white to-sand/70 px-5 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(185,140,90,0.12),transparent_65%)] lg:block"
            aria-hidden
          />

          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
              {t("eyebrow")}
            </p>
            <h2
              id="free-hosting-heading"
              className="mt-3 font-display text-[1.85rem] font-semibold leading-[1.1] tracking-tight text-charcoal sm:text-[2.35rem] lg:text-[2.6rem]"
            >
              {t("title")}
            </h2>
            <p className="mt-4 max-w-2xl text-[0.975rem] leading-relaxed text-muted sm:text-base">
              {t("subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={FREE_STAYS_PATH} className="home-btn-primary">
                <HeartHandshake className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                {t("primaryCta")}
              </Link>
              <Link href={FREE_HOSTING_OWNER_OFFER_HREF} className="home-btn-secondary">
                {t("secondaryCta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted/90">
              {t("clarity")}
            </p>
          </div>

          {hasOffers ? (
            <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
              {/* Real offer previews wired when getActiveFreeHostingOffers returns data */}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
