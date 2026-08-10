import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Heart, MapPin, MessageCircle, Search, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FreeStaysSearchBar } from "@/components/free-stays/FreeStaysSearchBar";
import { FreeStaysMapPanel } from "@/components/free-stays/FreeStaysMapPanel";
import { FreeStaysResultsList } from "@/components/free-stays/FreeStaysResultsList";
import { FreeHostingMark } from "@/components/brand/FreeHostingMark";
import {
  FreeHostingVisualPanel,
  toCompactFreeHostingOffers,
} from "@/components/brand/FreeHostingVisualPanel";
import {
  FREE_HOSTING_OWNER_OFFER_HREF,
  FREE_STAYS_PATH,
  countActiveFreeHostingOffers,
  freeHostingListingsHref,
  getActiveFreeHostingOffers,
} from "@/lib/free-hosting";
import { HOME_OWNER_LISTING_HREF } from "@/lib/homepage-content";
import { formatDateKeyDisplay } from "@/lib/availability-calendar";
import { buildMapMarkersFromListings } from "@/lib/listings-map-markers";

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
  { icon: Heart, titleKey: "guestStep4Title", textKey: "guestStep4Text" },
] as const;

const OWNER_STEPS = [
  { titleKey: "ownerStep1Title", textKey: "ownerStep1Text" },
  { titleKey: "ownerStep2Title", textKey: "ownerStep2Text" },
  { titleKey: "ownerStep3Title", textKey: "ownerStep3Text" },
  { titleKey: "ownerStep4Title", textKey: "ownerStep4Text" },
] as const;

const GUEST_POINTS = ["point1", "point2", "point3"] as const;
const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4"] as const;

export default async function FreeStaysPage() {
  const t = await getTranslations("FreeStays");
  const locale = await getLocale();
  const [offerCount, previewOffers] = await Promise.all([
    countActiveFreeHostingOffers(),
    getActiveFreeHostingOffers(6),
  ]);
  const browseHref = freeHostingListingsHref();
  const markers = buildMapMarkersFromListings(
    previewOffers.map((o) => o.listing),
    "short_term"
  ).map((m) => ({
    ...m,
    priceLabel: "0 €",
    priceUnit: "",
    price: 0,
  }));
  const compactHeroOffers = toCompactFreeHostingOffers(
    previewOffers.slice(0, 3),
    (start, endExclusive) =>
      `${formatDateKeyDisplay(start, locale)} → ${formatDateKeyDisplay(endExclusive, locale)}`
  );

  return (
    <div className="midora-msearch-shell">
      <Navbar />
      {/*
        Navbar is `fixed top-0`. Established Midora clearance is `pt-24` on main
        (PublicPageLayout / contact / faq / etc). Do not rely on hero-only padding —
        with `items-end` the taller right visual grew upward under the header.
      */}
      <main id="main-content" className="overflow-x-hidden pt-24">
        {/* A + B. Hero + search as one composition */}
        <section className="relative home-bg-cream pb-2 pt-5 sm:pt-6 lg:pb-0 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
              <div className="pb-2 lg:pb-10">
                <div className="flex items-start gap-2.5">
                  <FreeHostingMark className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
                      {t("hero.eyebrow")}
                    </p>
                    <p className="mt-1 text-[11px] font-medium tracking-[0.04em] text-muted">
                      {t("hero.eyebrowSub")}
                    </p>
                  </div>
                </div>
                <h1 className="mt-4 max-w-2xl font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-charcoal sm:text-[2.75rem] lg:text-[3.05rem]">
                  {t("hero.title")}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                  {t("hero.subtitle")}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted/90">
                  {t("hero.note")}
                </p>
              </div>

              <div className="hidden lg:block">
                <FreeHostingVisualPanel
                  offers={compactHeroOffers}
                  emptyLabel={t("hero.visualEmpty")}
                  className="min-h-[280px]"
                />
              </div>
            </div>

            <div className="relative z-10 -mb-6 mt-6 sm:-mb-7 sm:mt-7 lg:-mb-8 lg:mt-0">
              <FreeStaysSearchBar />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white" aria-hidden />
        </section>

        {/* C + D. Results + real map */}
        <section
          id="results"
          aria-labelledby="free-stays-results-heading"
          className="home-section home-bg-white pt-12 sm:pt-14"
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
              {offerCount > 0 ? (
                <Link href={browseHref} className="home-btn-secondary text-sm">
                  {t("results.browseMap")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.95fr)] lg:items-start">
              <FreeStaysResultsList
                offers={previewOffers}
                platformOfferCount={offerCount}
                clearHref={FREE_STAYS_PATH}
                changeDatesHref={`${FREE_STAYS_PATH}#results`}
              />
              <FreeStaysMapPanel
                markers={markers}
                ariaLabel={t("map.aria")}
                className="lg:sticky lg:top-[5.5rem]"
                height="420px"
              />
            </div>
          </div>
        </section>

        {/* Editorial moment — one only */}
        <section className="relative overflow-hidden bg-charcoal text-[#f7f1e8]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(185,140,90,0.18),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <FreeHostingMark className="h-8 w-8 text-gold" />
            <p className="mt-6 max-w-3xl font-display text-[1.65rem] font-semibold leading-[1.2] tracking-tight sm:text-[2.15rem] lg:text-[2.45rem]">
              {t("editorial.title")}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              {t("editorial.body")}
            </p>
          </div>
        </section>

        {/* E. How it works — journey */}
        <section className="home-section home-section--editorial home-bg-cream">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-charcoal sm:text-[2.15rem]">
              {t("how.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
              {t("how.subtitle")}
            </p>
            <ol className="relative mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
              {GUEST_STEPS.map((step, index) => (
                  <li
                    key={step.titleKey}
                    className="relative border-b border-charcoal/8 px-1 py-6 last:border-b-0 sm:border-b-0 sm:px-4 sm:py-2 lg:border-r lg:border-charcoal/8 lg:last:border-r-0"
                  >
                    {index < GUEST_STEPS.length - 1 ? (
                      <span
                        className="pointer-events-none absolute top-10 right-0 hidden h-px w-6 translate-x-1/2 bg-gold/40 lg:block"
                        aria-hidden
                      />
                    ) : null}
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-[12px] font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="mt-4 flex items-center gap-2">
                      <step.icon className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden />
                      <h3 className="font-display text-base font-semibold text-charcoal">
                        {t(step.titleKey)}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{t(step.textKey)}</p>
                  </li>
              ))}
            </ol>
          </div>
        </section>

        {/* F + G Guest / Owner balanced */}
        <section className="home-section home-bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:items-start">
            <div className="rounded-[1.35rem] border border-charcoal/8 bg-sand/25 p-6 sm:p-7">
              <h2 className="font-display text-2xl font-semibold text-charcoal">
                {t("forGuests.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                {t("forGuests.body")}
              </p>
              <ul className="mt-6 space-y-3.5">
                {GUEST_POINTS.map((key, index) => (
                  <li key={key} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-charcoal text-[11px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-charcoal/90">
                      {t(`forGuests.${key}`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.35rem] border border-charcoal/8 bg-white p-6 shadow-soft sm:p-7">
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

        {/* I. FAQ polish */}
        <section className="home-section home-bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-charcoal">{t("faq.title")}</h2>
            <div className="mt-8 space-y-2.5">
              {FAQ_KEYS.map((key) => (
                <details
                  key={key}
                  className="group rounded-2xl border border-border/90 bg-sand/25 px-5 py-4 transition open:border-charcoal/10 open:bg-white open:shadow-soft"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>{t(`${key}Q`)}</span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-muted transition group-open:rotate-45 group-open:border-gold/40 group-open:text-gold"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 border-t border-charcoal/6 pt-3 text-sm leading-relaxed text-muted">
                    {t(`${key}A`)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* J. Final CTA */}
        <section className="home-section home-section--editorial home-bg-cream">
          <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-charcoal/8 bg-white px-6 py-12 text-center shadow-soft sm:px-10 sm:py-14">
            <FreeHostingMark className="mx-auto h-7 w-7" />
            <h2 className="mt-4 font-display text-[1.75rem] font-semibold text-charcoal sm:text-[2.15rem]">
              {t("final.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {t("final.body")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={browseHref} className="home-btn-primary">
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
