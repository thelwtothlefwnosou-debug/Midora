"use client";

import { useCallback, useEffect, useState } from "react";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import { useDateRangeSelection } from "@/hooks/useDateRangeSelection";
import { listingHasPublicCalendarData } from "@/lib/listing-public-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import {
  formatDateKeyDisplay,
  normalizeDateRange,
  stayNightsBetween,
} from "@/lib/availability-calendar";
import type { ListingPublicDetail } from "@/lib/types";

type Props = {
  listing: ListingPublicDetail;
  periods: ListingUnavailablePeriod[];
};

export function AvailabilityCalendarSection({ listing, periods }: Props) {
  const { openInterest } = useListingInterest();
  const {
    appliedRange,
    setAppliedRange,
    minimumStayNights,
    range,
    rangeMeetsMinStay,
    clearDates,
    guests,
  } = useListingInquiryDates();

  const hasCalendarData = listingHasPublicCalendarData(listing, periods);

  const [month, setMonth] = useState(() => {
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
    if (!appliedRange?.start) {
      clearSelection();
      return;
    }
    if (appliedRange.start !== appliedRange.end) {
      setRange(appliedRange.start, appliedRange.end);
      return;
    }
    setRange(appliedRange.start, null);
  }, [appliedRange, clearSelection, setRange]);

  useEffect(() => {
    if (!selectionStart) return;

    if (selectionEnd && selectionStart !== selectionEnd) {
      const { start, end } = normalizeDateRange(selectionStart, selectionEnd);
      if (appliedRange?.start !== start || appliedRange?.end !== end) {
        setAppliedRange({ start, end });
      }
      return;
    }

    if (!selectionEnd && appliedRange?.start !== selectionStart) {
      setAppliedRange({ start: selectionStart, end: selectionStart });
    }
  }, [appliedRange?.end, appliedRange?.start, selectionEnd, selectionStart, setAppliedRange]);

  const handleClearDates = useCallback(() => {
    clearDates();
    clearSelection();
  }, [clearDates, clearSelection]);

  return (
    <section id="availability" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">Ενδεικτική διαθεσιμότητα</h2>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/65">
        {hasCalendarData
          ? "Επίλεξε ημερομηνίες και στείλε αίτημα στον ιδιοκτήτη για επιβεβαίωση. Υπόκειται σε επιβεβαίωση από τον ιδιοκτήτη."
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
          {(range || selectionStart) && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-charcoal">
                {range ? (
                  <>
                    {formatDateKeyDisplay(range.start)} – {formatDateKeyDisplay(range.end)}
                    <span className="ml-2 font-normal text-muted">
                      ({stayNightsBetween(range.start, range.end)}{" "}
                      {stayNightsBetween(range.start, range.end) === 1 ? "νύχτα" : "νύχτες"})
                    </span>
                  </>
                ) : (
                  <>
                    Άφιξη: {formatDateKeyDisplay(selectionStart!)}
                    <span className="ml-2 font-normal text-muted">— επίλεξε αναχώρηση</span>
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={handleClearDates}
                className="text-sm font-medium text-gold-dark hover:underline"
              >
                Καθαρισμός ημερομηνιών
              </button>
            </div>
          )}

          {range && !rangeMeetsMinStay && minimumStayNights > 1 && (
            <p className="mt-2 text-sm text-amber-800">
              Ελάχιστη διαμονή {minimumStayNights}{" "}
              {minimumStayNights === 1 ? "νύχτα" : "νύχτες"}.
            </p>
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
              onDateClick={handleDateClick}
              minimumStayNights={minimumStayNights}
              showLegend
              layout="responsive"
              compact
            />
          </div>
        </>
      )}
    </section>
  );
}
