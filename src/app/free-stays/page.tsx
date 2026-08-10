import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, HeartHandshake, MapPin, MessageCircle, Search, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FreeStaysSearchBar } from "@/components/free-stays/FreeStaysSearchBar";
import {
  FREE_HOSTING_OWNER_OFFER_HREF,
  FREE_STAYS_PATH,
  countActiveFreeHostingOffers,
} from "@/lib/free-hosting";
import { HOME_OWNER_LISTING_HREF } from "@/lib/homepage-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FreeStays.meta");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: FREE_STAYS_PATH },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: FREE_STAYS_PATH,
      type: "website",
    },
  };
}

const GUEST_STEPS = [
  { icon: Search, titleKey: "guestStep1Title", textKey: "guestStep1Text" },
  { icon: MapPin, titleKey: "guestStep2Title", textKey: "guestStep2Text" },
  { icon: MessageCircle, titleKey: "guestStep3Title", textKey: "guestStep3Text" },
  { icon: HeartHandshake, titleKey: "guestStep4Title", textKey: "guestStep4Text" },
] as const;

const OWNER_STEPS = [
  { titleKey: "ownerStep1Title", textKey: "ownerStep1Text" },
  { titleKey: "ownerStep2Title", textKey: "ownerStep2Text" },
  { titleKey: "ownerStep3Title", textKey: "ownerStep3Text" },
  { titleKey: "ownerStep4Title", textKey: "ownerStep4Text" },
] as const;

const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4"] as const;

export default async function FreeStaysPage() {
  const t = await getTranslations("FreeStays");
  const offerCount = await countActiveFreeHostingOffers();

  return (
    <div className="midora-msearch-shell">
      <Navbar />
      <main id="main-content" className="overflow-x-hidden">
        {/* A. Hero */}
        <section className="home-section home-section--editorial home-bg-cream border-b border-charcoal/6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-charcoal sm:text-[2.75rem] lg:text-[3.15rem]">
              {t("hero.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted/90">
              {t("hero.note")}
            </p>
          </div>
        </section>

        {/* B. Search */}
        <section className="home-bg-white px-4 pb-2 pt-6 sm:px-6 sm:pt-8">
          <div className="mx-auto max-w-7xl">
            <FreeStaysSearchBar />
          </div>
        </section>

        {/* C + D. Results + map placeholder (real map after offer matching) */}
        <section
          id="results"
          aria-labelledby="free-stays-results-heading"
          className="home-section home-bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="free-stays-results-heading"
                  className="font-display text-xl font-semibold text-charcoal sm:text-2xl"
                >
                  {t("results.title")}
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  {offerCount === 0
                    ? t("results.emptyCount")
                    : t("results.count", { count: offerCount })}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
              <div className="rounded-[1.5rem] border border-dashed border-charcoal/12 bg-sand/40 px-6 py-14 text-center">
                <p className="font-display text-lg font-semibold text-charcoal">
                  {t("results.emptyTitle")}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {t("results.emptyBody")}
                </p>
                <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-charcoal/80">
                  <li>• {t("results.tipDates")}</li>
                  <li>• {t("results.tipArea")}</li>
                  <li>• {t("results.tipGuests")}</li>
                </ul>
              </div>

              <div
                className="flex min-h-[240px] items-center justify-center rounded-[1.5rem] border border-charcoal/8 bg-sand/50 px-6 py-10 text-center lg:min-h-[320px]"
                role="img"
                aria-label={t("map.placeholderAria")}
              >
                <div>
                  <MapPin className="mx-auto h-7 w-7 text-gold" strokeWidth={1.5} aria-hidden />
                  <p className="mt-3 text-sm font-medium text-charcoal">{t("map.placeholderTitle")}</p>
                  <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
                    {t("map.placeholderBody")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. How it works */}
        <section className="home-section home-section--editorial home-bg-cream">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-charcoal sm:text-[2.15rem]">
              {t("how.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
              {t("how.subtitle")}
            </p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {GUEST_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.titleKey}
                    className="rounded-2xl border border-charcoal/8 bg-white p-5 shadow-soft"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-[12px] font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="mt-4 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden />
                      <h3 className="font-display text-base font-semibold text-charcoal">
                        {t(step.titleKey)}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{t(step.textKey)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* F + G */}
        <section className="home-section home-bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold text-charcoal">
                {t("forGuests.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                {t("forGuests.body")}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-charcoal">
                {t("forOwners.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                {t("forOwners.body")}
              </p>
              <ol className="mt-6 space-y-4">
                {OWNER_STEPS.map((step, index) => (
                  <li key={step.titleKey} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-semibold text-gold-dark">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{t(step.titleKey)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{t(step.textKey)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href={FREE_HOSTING_OWNER_OFFER_HREF}
                className="home-btn-secondary mt-7 inline-flex"
              >
                {t("forOwners.cta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* H. Safety */}
        <section className="home-section home-bg-sand">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex gap-4 rounded-[1.5rem] border border-charcoal/8 bg-white p-6 sm:p-8">
              <Shield className="mt-0.5 h-6 w-6 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
              <div>
                <h2 className="font-display text-xl font-semibold text-charcoal">
                  {t("safety.title")}
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                  <li>{t("safety.line1")}</li>
                  <li>{t("safety.line2")}</li>
                  <li>{t("safety.line3")}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* I. FAQ */}
        <section className="home-section home-bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-charcoal">{t("faq.title")}</h2>
            <div className="mt-8 space-y-3">
              {FAQ_KEYS.map((key) => (
                <details
                  key={key}
                  className="group rounded-2xl border border-border bg-sand/30 px-5 py-4 open:bg-white open:shadow-soft"
                >
                  <summary className="cursor-pointer list-none font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
                    {t(`${key}Q`)}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{t(`${key}A`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* J. Final CTA */}
        <section className="home-section home-section--editorial home-bg-cream">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
            <h2 className="font-display text-[1.75rem] font-semibold text-charcoal sm:text-[2.15rem]">
              {t("final.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {t("final.body")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={FREE_STAYS_PATH} className="home-btn-primary">
                {t("final.searchCta")}
              </Link>
              <Link href={HOME_OWNER_LISTING_HREF} className="home-btn-secondary">
                {t("final.ownerCta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
