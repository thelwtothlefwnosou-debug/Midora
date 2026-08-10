"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingBadge } from "@/lib/listing-badges";
import type { ListingWithImages } from "@/lib/types";
import { formatDateKeyDisplay } from "@/lib/availability-calendar";
import { FREE_HOSTING_OWNER_OFFER_HREF } from "@/lib/free-hosting-paths";

type OfferCard = {
  id: string;
  startDate: string;
  endExclusive: string;
  maxNights: number;
  maxGuests: number;
  listing: ListingWithImages;
};

type Props = {
  offers: OfferCard[];
  platformOfferCount: number;
  clearHref: string;
  changeDatesHref?: string;
};

export function FreeStaysResultsList({
  offers,
  platformOfferCount,
  clearHref,
  changeDatesHref,
}: Props) {
  const t = useTranslations("FreeStays.results");
  const locale = useLocale();

  if (offers.length === 0) {
    const isLaunch = platformOfferCount === 0;
    return (
      <div className="rounded-[1.25rem] border border-charcoal/8 bg-sand/35 px-5 py-5 sm:px-5 sm:py-5">
        <p className="font-display text-base font-semibold text-charcoal sm:text-lg">
          {isLaunch ? t("launchTitle") : t("emptyTitle")}
        </p>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
          {isLaunch ? t("launchBody") : t("emptyBody")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {changeDatesHref ? (
            <Link href={changeDatesHref} className="home-btn-secondary h-9 text-sm">
              {t("changeDates")}
            </Link>
          ) : null}
          <Link href={clearHref} className="home-btn-secondary h-9 text-sm">
            {t("clearSearch")}
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">
          <Link
            href={FREE_HOSTING_OWNER_OFFER_HREF}
            className="font-medium text-charcoal underline decoration-gold/50 underline-offset-4 transition hover:decoration-gold"
          >
            {t("ownerSoftCta")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {offers.map((offer, index) => {
        const freeBadge: ListingBadge = {
          kind: "free_hosting",
          label: t("badge"),
          priority: 0,
        };
        const windowLabel = t("offerWindow", {
          from: formatDateKeyDisplay(offer.startDate, locale),
          to: formatDateKeyDisplay(offer.endExclusive, locale),
        });
        return (
          <div key={offer.id} className="space-y-2">
            <ListingCard
              listing={offer.listing}
              index={index}
              variant="home"
              badges={[freeBadge]}
            />
            <div className="px-1">
              <p className="text-sm font-medium text-charcoal">{t("noLodgingCharge")}</p>
              <p className="mt-0.5 text-sm text-muted">
                <span className="font-semibold text-charcoal">{t("zeroPrice")}</span>
                {" · "}
                {windowLabel}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {t("maxNights", { count: offer.maxNights })}
                {" · "}
                {t("maxGuests", { count: offer.maxGuests })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
