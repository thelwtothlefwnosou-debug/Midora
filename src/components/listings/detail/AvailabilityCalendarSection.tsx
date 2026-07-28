"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { OwnerPricePreview } from "@/components/dashboard/OwnerPricePreview";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import { useDateRangeSelection } from "@/hooks/useDateRangeSelection";
import { listingHasPublicCalendarData } from "@/lib/listing-public-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { computeIndicativeStayPrice } from "@/lib/listing-short-term-price";
import type { ListingPublicDetail } from "@/lib/types";

type Props = {
  listing: ListingPublicDetail;
  periods: ListingUnavailablePeriod[];
};

function monthFromDateKey(dateKey: string): Date {
  const [y, m] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function AvailabilityCalendarSection({ listing, periods }: Props) {
  const t = useTranslations("Listing");
  const tSection = useTranslations("Listing.availabilitySection");
  const { openInterest } = useListingInterest();
  const {
    displayRange,
    userSelectedRange,
    setUserSelectedRange,
    minimumStayNights,
    rangeMeetsMinStay,
    guests,
  } = useListingInquiryDates();

  const hasCalendarData = listingHasPublicCalendarData(listing, periods);
  const priceRules = listing.price_rules ?? [];
  const isProgrammaticSync = useRef(false);
  const userChangedSelectionRef = useRef(false);

  const indicativePrice = useMemo(() => {
    if (!displayRange?.start || !displayRange?.end || displayRange.start === displayRange.end) {
      return null;
    }
    return computeIndicativeStayPrice(
      listing,
      priceRules,
      displayRange.start,
      displayRange.end,
      guests,
      periods
    );
  }, [displayRange, listing, priceRules, guests, periods]);

  const [month, setMonth] = useState(() => {
    if (displayRange?.start) return monthFromDateKey(displayRange.start);
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const {
    selectionStart,
    selectionEnd,
    handleDateClick,
    setRange,
    clearSelection,
  } = useDateRangeSelection({
    periods,
    listingId: listing.id,
    minimumStayNights,
  });

  useEffect(() => {
    // Keep in-progress check-out selection local — don't snap back to default preview.
    if (selectionStart && !selectionEnd) return;

    if (!displayRange?.start) {
      if (!selectionStart) clearSelection();
      return;
    }
    if (displayRange.start !== displayRange.end) {
      isProgrammaticSync.current = true;
      setRange(displayRange.start, displayRange.end);
      return;
    }
    isProgrammaticSync.current = true;
    setRange(displayRange.start, null);
  }, [clearSelection, displayRange, selectionEnd, selectionStart, setRange]);

  useEffect(() => {
    if (isProgrammaticSync.current) {
      isProgrammaticSync.current = false;
      return;
    }
    if (!userChangedSelectionRef.current) return;
    userChangedSelectionRef.current = false;
    if (!selectionStart) return;

    if (!selectionEnd || selectionStart === selectionEnd) {
      setUserSelectedRange({ start: selectionStart, end: selectionStart });
      return;
    }

    if (
      userSelectedRange?.start !== selectionStart ||
      userSelectedRange?.end !== selectionEnd
    ) {
      setUserSelectedRange({ start: selectionStart, end: selectionEnd });
    }
  }, [
    selectionEnd,
    selectionStart,
    setUserSelectedRange,
    userSelectedRange?.end,
    userSelectedRange?.start,
  ]);

  const handleUserDateClick = useCallback(
    (dateKey: string) => {
      userChangedSelectionRef.current = true;
      handleDateClick(dateKey);
    },
    [handleDateClick]
  );

  return (
    <section id="availability" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">{t("availability")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/65">
        {hasCalendarData ? tSection("descriptionWithCalendar") : tSection("descriptionNoCalendar")}
      </p>

      {!hasCalendarData ? (
        <button
          type="button"
          onClick={() =>
            openInterest({
              guests,
              message: tSection("inquiryMessage"),
            })
          }
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-charcoal/12 px-5 text-sm font-medium text-charcoal transition-colors hover:border-gold/35"
        >
          {t("sendAvailabilityRequest")}
        </button>
      ) : (
        <>
          {displayRange && !rangeMeetsMinStay && minimumStayNights > 1 && (
            <p className="mt-4 text-sm text-amber-800">
              {t("minStayNights", { count: minimumStayNights })}
            </p>
          )}

          {indicativePrice && rangeMeetsMinStay && (
            <div className="mt-4">
              <OwnerPricePreview price={indicativePrice} variant="public" />
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-charcoal/8 bg-white p-4 sm:p-5">
            <AvailabilityCalendarPanel
              month={month}
              onPrevMonth={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              onNextMonth={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
              periods={periods}
              mode="interest"
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onDateClick={handleUserDateClick}
              minimumStayNights={minimumStayNights}
              layout="responsive"
              compact
              showLegend
              unavailableDayStyle="premium-blocked"
            />
          </div>
        </>
      )}
    </section>
  );
}
