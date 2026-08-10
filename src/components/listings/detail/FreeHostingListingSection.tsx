"use client";

import { FreeHostingMark } from "@/components/brand/FreeHostingMark";
import { useLocale, useTranslations } from "next-intl";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import {
  offerMatchesRequestedStay,
  suggestStayWithinOffer,
} from "@/lib/free-hosting-match";
import { formatDateKeyDisplay } from "@/lib/availability-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

type FreeHostingOfferView = {
  id: string;
  startDate: string;
  endExclusive: string;
  maxNights: number;
  maxGuests: number;
  ownerMessage: string | null;
};

type Props = {
  offers: FreeHostingOfferView[];
  periods: ListingUnavailablePeriod[];
};

export function FreeHostingListingSection({ offers, periods }: Props) {
  const t = useTranslations("Listing.freeHosting");
  const locale = useLocale();
  const { openInterest } = useListingInterest();
  const { displayRange, guests } = useListingInquiryDates();

  if (offers.length === 0) return null;

  function requestForOffer(offer: FreeHostingOfferView) {
    const userFrom = displayRange?.start;
    const userTo = displayRange?.end;
    const userFits =
      userFrom &&
      userTo &&
      offerMatchesRequestedStay(offer, userFrom, userTo, guests, periods);

    const suggested = userFits
      ? { start: userFrom!, end: userTo! }
      : suggestStayWithinOffer(offer);

    openInterest({
      leadKind: "free_hosting",
      intent: "interest",
      rentalMode: "short_term",
      guests,
      interestStartDate: suggested?.start,
      interestEndDate: suggested?.end,
      message: t("subtitle"),
    });
  }

  return (
    <section
      id="free-hosting"
      aria-labelledby="listing-free-hosting-heading"
      className="mt-8 rounded-[1.25rem] border border-charcoal/8 bg-gradient-to-br from-[#fbf8f3] via-white to-sand/60 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal text-white">
          <FreeHostingMark className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0">
          <h2
            id="listing-free-hosting-heading"
            className="font-display text-lg font-semibold text-charcoal sm:text-xl"
          >
            {t("title")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="rounded-xl border border-charcoal/8 bg-white/80 px-4 py-3"
          >
            <p className="text-sm font-medium text-charcoal">
              {t("window", {
                from: formatDateKeyDisplay(offer.startDate, locale),
                to: formatDateKeyDisplay(offer.endExclusive, locale),
              })}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("maxNights", { count: offer.maxNights })}
              {" · "}
              {t("maxGuests", { count: offer.maxGuests })}
            </p>
            {offer.ownerMessage?.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-charcoal/85">
                {offer.ownerMessage.trim()}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => requestForOffer(offer)}
              className="home-btn-primary mt-3 h-10 w-full text-sm sm:w-auto sm:px-4"
            >
              {t("cta")}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-muted">{t("note")}</p>
    </section>
  );
}
