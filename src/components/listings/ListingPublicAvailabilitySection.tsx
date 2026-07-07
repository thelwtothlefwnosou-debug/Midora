"use client";

import { useState } from "react";
import { Calendar, CalendarRange, MessageSquare } from "lucide-react";
import {
  InterestDateRangePicker,
  type DateRangeValue,
} from "@/components/availability/InterestDateRangePicker";
import {
  formatDateKeyDisplay,
  normalizeDateRange,
  stayNightsBetween,
  todayDateKey,
} from "@/lib/availability-calendar";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import {
  formatInterestRangeLabel,
  formatMonthLabel,
} from "@/lib/search-interest-dates";
import {
  monthlyDurationOptions,
  resolveMinimumStayMonths,
  resolveMinimumStayNights,
} from "@/lib/listing-rental-modes";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { formatUnavailablePeriodRange } from "@/lib/unavailable-periods";
import type { ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingWithImages;
  periods: ListingUnavailablePeriod[];
};

export function ListingPublicAvailabilitySection({ listing, periods }: Props) {
  const { mode, showShort, showMonthly } = useListingRentalMode();
  const { openInterest } = useListingInterest();

  const minStayMonths = resolveMinimumStayMonths(listing);
  const minimumStayNights = resolveMinimumStayNights(listing);
  const durationOptions = monthlyDurationOptions(minStayMonths);

  const [appliedRange, setAppliedRange] = useState<DateRangeValue>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [durationMonths, setDurationMonths] = useState(minStayMonths);
  const activeDuration = Math.max(minStayMonths, durationMonths);

  const viewingShort = mode === "short_term" && showShort;
  const viewingMonthly = mode === "monthly" && showMonthly;

  function openContactWithDates() {
    if (!appliedRange?.start || !appliedRange.end) {
      openInterest();
      return;
    }
    const { start, end } = normalizeDateRange(appliedRange.start, appliedRange.end);
    openInterest({
      interestStartDate: start,
      interestEndDate: end,
      timingNote: formatInterestRangeLabel(start, end),
      message: `Ενδιαφέρομαι για το ακίνητο από ${formatInterestRangeLabel(start, end)}. Θα ήθελα να επικοινωνήσουμε για περισσότερες πληροφορίες.`,
    });
  }

  function openContactWithMonth() {
    if (activeDuration < minStayMonths) return;
    const durationLabel =
      durationOptions.find((o) => o.value === activeDuration)?.label ??
      `${activeDuration} μήνες`;
    openInterest({
      interestStartMonth: startMonth,
      interestDurationMonths: activeDuration,
      timingNote: formatMonthLabel(startMonth),
      duration: durationLabel,
      message: `Ενδιαφέρομαι για το ακίνητο από ${formatMonthLabel(startMonth)} για διάρκεια ${durationLabel}. Θα ήθελα να επικοινωνήσουμε για περισσότερες πληροφορίες.`,
    });
  }

  const hasSelection = Boolean(appliedRange?.start && appliedRange.end);
  const resolvedRange =
    appliedRange?.start && appliedRange.end
      ? normalizeDateRange(appliedRange.start, appliedRange.end)
      : null;
  const periodInvalid = activeDuration < minStayMonths;

  if (!viewingShort && !viewingMonthly) return null;

  return (
    <section
      className={cn(
        "listing-section rounded-2xl border border-border bg-white px-4 py-8 shadow-soft sm:px-6",
        viewingShort && "border-gold/20"
      )}
    >
      <h2 className="listing-section-title flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gold" />
        {viewingMonthly ? "Περίοδος ενδιαφέροντος" : "Διαθεσιμότητα"}
      </h2>

      {viewingShort && (
        <>
          <p className="mt-2 text-sm text-muted">
            Επίλεξε ημερομηνίες ενδιαφέροντος και στείλε μήνυμα στον αγγελιοδότη.
          </p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-5 flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-soft transition-colors hover:border-gold/35 sm:p-5"
          >
            <CalendarRange className="h-5 w-5 shrink-0 text-gold" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                Ημερομηνίες ενδιαφέροντος
              </p>
              {resolvedRange ? (
                <>
                  <p className="mt-0.5 text-sm font-medium text-charcoal">
                    {formatDateKeyDisplay(resolvedRange.start)} –{" "}
                    {formatDateKeyDisplay(resolvedRange.end)}
                  </p>
                  <p className="text-xs text-gold-dark">
                    {stayNightsBetween(resolvedRange.start, resolvedRange.end)} νύχτες
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-sm text-muted">Επίλεξε άφιξη και αναχώρηση</p>
              )}
            </div>
          </button>
          <InterestDateRangePicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            value={appliedRange}
            onApply={setAppliedRange}
            periods={periods}
            minimumStayNights={minimumStayNights}
            listingId={listing.id}
            showLegend
          />
        </>
      )}

      {viewingMonthly && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium tracking-wide text-muted uppercase">
              Μήνας έναρξης
            </span>
            <input
              type="month"
              value={startMonth}
              min={todayDateKey().slice(0, 7)}
              onChange={(e) => setStartMonth(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium tracking-wide text-muted uppercase">
              Διάρκεια
            </span>
            <select
              value={activeDuration}
              onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              {durationOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {periods.length > 0 && viewingShort ? (
        <>
          <p className="mt-5 text-sm text-muted">
            Ορισμένες περίοδοι έχουν δηλωθεί ως μη διαθέσιμες από τον αγγελιοδότη.
          </p>
          <ul className="mt-3 space-y-2">
            {periods.map((period) => (
              <li
                key={period.id}
                className="listing-card px-4 py-2.5 text-sm text-charcoal"
              >
                Μη διαθέσιμο:{" "}
                {formatUnavailablePeriodRange(period.start_date, period.end_date)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-5 text-sm text-muted">
          Η διαθεσιμότητα επιβεβαιώνεται απευθείας με τον αγγελιοδότη.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        {viewingMonthly
          ? "Η περίοδος ενδιαφέροντος αποστέλλεται ενημερωτικά στον αγγελιοδότη. Η τελική επιβεβαίωση και οποιαδήποτε συμφωνία γίνονται εκτός Midora."
          : "Η διαθεσιμότητα εμφανίζεται για ενημέρωση. Η τελική επιβεβαίωση και οποιαδήποτε συμφωνία γίνονται απευθείας με τον αγγελιοδότη, εκτός Midora."}
      </p>

      {viewingMonthly && periodInvalid && (
        <p className="mt-3 text-sm text-amber-800">
          Η ελάχιστη διάρκεια για αυτή την αγγελία είναι {minStayMonths} μήνες.
        </p>
      )}

      {viewingShort && (
        <button
          type="button"
          onClick={openContactWithDates}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-white hover:bg-gold-dark"
        >
          <MessageSquare className="h-4 w-4" />
          {hasSelection
            ? "Στείλε ενδιαφέρον για αυτές τις ημερομηνίες"
            : "Στείλε ενδιαφέρον"}
        </button>
      )}

      {viewingMonthly && (
        <button
          type="button"
          onClick={openContactWithMonth}
          disabled={periodInvalid}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-white hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageSquare className="h-4 w-4" />
          Στείλε ενδιαφέρον για αυτή την περίοδο
        </button>
      )}
    </section>
  );
}
