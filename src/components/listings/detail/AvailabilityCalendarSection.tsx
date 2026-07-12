"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { OwnerPricePreview } from "@/components/dashboard/OwnerPricePreview";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import { useDateRangeSelection } from "@/hooks/useDateRangeSelection";
import { listingHasPublicCalendarData } from "@/lib/listing-public-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import {
  formatDateKeyDisplay,
  stayNightsBetween,
} from "@/lib/availability-calendar";
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
  const { openInterest } = useListingInterest();
  const {
    displayRange,
    userSelectedRange,
    setUserSelectedRange,
    minimumStayNights,
    rangeMeetsMinStay,
    clearDates,
    guests,
  } = useListingInquiryDates();

  const hasCalendarData = listingHasPublicCalendarData(listing, periods);
  const priceRules = listing.price_rules ?? [];
  const isProgrammaticSync = useRef(false);
  const userChangedSelectionRef = useRef(false);

  const locationLabel =
    listing.area_display_name ?? listing.area ?? listing.city_display_name ?? listing.city;

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
    if (!displayRange?.start) {
      clearSelection();
      return;
    }
    if (displayRange.start !== displayRange.end) {
      isProgrammaticSync.current = true;
      setRange(displayRange.start, displayRange.end);
      return;
    }
    isProgrammaticSync.current = true;
    setRange(displayRange.start, null);
  }, [displayRange, clearSelection, setRange]);

  useEffect(() => {
    if (isProgrammaticSync.current) {
      isProgrammaticSync.current = false;
      return;
    }
    if (!userChangedSelectionRef.current) return;
    userChangedSelectionRef.current = false;
    if (!selectionStart) return;

    if (selectionEnd && selectionStart !== selectionEnd) {
      if (
        userSelectedRange?.start !== selectionStart ||
        userSelectedRange?.end !== selectionEnd
      ) {
        setUserSelectedRange({ start: selectionStart, end: selectionEnd });
      }
      return;
    }

    if (!selectionEnd && userSelectedRange?.start !== selectionStart) {
      setUserSelectedRange({ start: selectionStart, end: selectionStart });
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

  const handleClearDates = useCallback(() => {
    clearDates();
  }, [clearDates]);

  const nights =
    displayRange && displayRange.start !== displayRange.end
      ? stayNightsBetween(displayRange.start, displayRange.end)
      : null;

  const calendarTitle =
    displayRange && nights
      ? `${locationLabel} – ${nights} ${nights === 1 ? "διανυκτέρευση" : "διανυκτερεύσεις"}`
      : "Επίλεξε ημερομηνίες";

  const calendarSubtitle =
    displayRange && nights
      ? `${formatDateKeyDisplay(displayRange.start)} – ${formatDateKeyDisplay(displayRange.end)}`
      : null;

  return (
    <section id="availability" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">Διαθεσιμότητα</h2>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/65">
        {hasCalendarData
          ? "Επίλεξε ημερομηνίες και στείλε αίτημα στον ιδιοκτήτη. Η τελική διαθεσιμότητα και τιμή επιβεβαιώνονται από τον ιδιοκτήτη."
          : "Επικοινώνησε με τον ιδιοκτήτη για διαθεσιμότητα και τελική τιμή."}
      </p>

      {!hasCalendarData ? (
        <button
          type="button"
          onClick={() =>
            openInterest({
              guests,
              message:
                "Καλησπέρα, ενδιαφέρομαι για το ακίνητο. Θα ήθελα να επιβεβαιώσω τη διαθεσιμότητα και την τελική τιμή.",
            })
          }
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-charcoal/12 px-5 text-sm font-medium text-charcoal transition-colors hover:border-gold/35"
        >
          Στείλε αίτημα διαθεσιμότητας
        </button>
      ) : (
        <>
          <div className="mt-5">
            <p className="font-display text-base font-semibold text-charcoal">{calendarTitle}</p>
            {calendarSubtitle ? (
              <p className="mt-1 text-sm text-muted">{calendarSubtitle}</p>
            ) : null}
          </div>

          {(displayRange || selectionStart) && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleClearDates}
                className="text-sm font-medium text-gold-dark hover:underline"
              >
                Εκκαθάριση ημερομηνιών
              </button>
            </div>
          )}

          {displayRange && !rangeMeetsMinStay && minimumStayNights > 1 && (
            <p className="mt-2 text-sm text-amber-800">
              Ελάχιστη διαμονή {minimumStayNights}{" "}
              {minimumStayNights === 1 ? "νύχτα" : "νύχτες"}.
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
              showLegend={false}
            />
          </div>
        </>
      )}
    </section>
  );
}
