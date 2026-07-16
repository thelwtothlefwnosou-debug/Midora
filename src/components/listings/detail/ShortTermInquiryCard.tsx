"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { InterestDateRangePicker, type DateRangeFocusField } from "@/components/availability/InterestDateRangePicker";
import { ListingContactCard } from "@/components/listings/ListingContactCard";
import { ListingPortalDisclaimer } from "@/components/listings/detail/ListingPortalDisclaimer";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import type { ListingPublicContact } from "@/lib/listing-contact";
import {
  computeIndicativeStayPrice,
  formatPublicStayPriceNightsLine,
  formatPublicStayPriceTotal,
  stayRangeHasBlockedNight,
} from "@/lib/listing-short-term-price";
import type { ListingPublicDetail } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import {
  formatDateKeyDisplay,
  stayNightsBetween,
} from "@/lib/availability-calendar";
import { formatInterestRangeLabel } from "@/lib/search-interest-dates";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  periods: ListingUnavailablePeriod[];
  contact: ListingPublicContact;
  className?: string;
};

export function ShortTermInquiryCard({
  listing,
  periods,
  contact,
  className,
}: Props) {
  const { openInterest } = useListingInterest();
  const {
    userSelectedRange,
    setUserSelectedRange,
    guests,
    setGuests,
    displayRange,
    pendingCheckIn,
    rangeMeetsMinStay,
    minimumStayNights,
    maxGuests,
  } = useListingInquiryDates();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFocus, setPickerFocus] = useState<DateRangeFocusField>("start");
  const [contactOpen, setContactOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const priceRules = listing.price_rules ?? [];

  const displayPrice = useMemo(() => {
    if (!displayRange?.start || !displayRange?.end || displayRange.start === displayRange.end) {
      return null;
    }
    if (stayRangeHasBlockedNight(displayRange.start, displayRange.end, periods)) return null;
    return computeIndicativeStayPrice(
      listing,
      priceRules,
      displayRange.start,
      displayRange.end,
      guests,
      periods
    );
  }, [displayRange, listing, priceRules, guests, periods]);

  const pickerValue = userSelectedRange;

  function openDatePicker(field: DateRangeFocusField) {
    setPickerFocus(field);
    setPickerOpen(true);
  }

  const guestLabel = `${guests} ${guests === 1 ? "άτομο" : "άτομα"}`;
  const hasDisplayPrice = Boolean(displayRange && rangeMeetsMinStay && displayPrice);

  function buildInquiryMessage(): string {
    const nights =
      displayRange && rangeMeetsMinStay
        ? stayNightsBetween(displayRange.start, displayRange.end)
        : null;
    const parts = [
      `Καλησπέρα, ενδιαφέρομαι για το ακίνητο${displayRange ? ` από ${formatInterestRangeLabel(displayRange.start, displayRange.end)}` : ""} για ${guestLabel}.`,
    ];
    if (nights) {
      parts.push(`Διάρκεια: ${nights} ${nights === 1 ? "νύχτα" : "νύχτες"}.`);
    }
    if (displayPrice) {
      parts.push(
        `Υπολογισμένη τιμή βάσει ημερολογίου: €${displayPrice.total.toLocaleString("el-GR")}.`
      );
      if (displayPrice.discountLabel) {
        parts.push(`${displayPrice.discountLabel}.`);
      }
    }
    parts.push("Θα ήθελα να επιβεβαιώσω τη διαθεσιμότητα και την τελική τιμή.");
    return parts.join(" ");
  }

  const hasDirectContact =
    (contact.allowPhone && contact.phone) ||
    Boolean(contact.email) ||
    (contact.allowWhatsApp && contact.whatsappUrl) ||
    (contact.allowViber && contact.viberPhone) ||
    contact.allowMessage;

  function handleContactOwner() {
    const hasDirect =
      (contact.allowPhone && contact.phone) ||
      Boolean(contact.email) ||
      (contact.allowWhatsApp && contact.whatsappUrl) ||
      (contact.allowViber && contact.viberPhone);
    if (hasDirect) {
      setContactOpen(true);
      return;
    }
    openInterest({
      guests,
      message: `Καλησπέρα, ενδιαφέρομαι για το ακίνητο για ${guestLabel}. Θα ήθελα περισσότερες πληροφορίες.`,
    });
  }

  function openAvailabilityRequest() {
    if (displayRange && !rangeMeetsMinStay) return;
    if (displayRange) {
      openInterest({
        guests,
        interestStartDate: displayRange.start,
        interestEndDate: displayRange.end,
        timingNote: formatInterestRangeLabel(displayRange.start, displayRange.end),
        message: buildInquiryMessage(),
      });
    } else {
      openInterest({
        guests,
        message: buildInquiryMessage(),
      });
    }
  }

  const activePrice = hasDisplayPrice ? displayPrice : null;

  const cardBody = (
    <>
      {activePrice ? (
        <div>
          <p className="listing-price-display text-2xl text-charcoal">
            {formatPublicStayPriceTotal(activePrice.total)}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {formatPublicStayPriceNightsLine(activePrice.nights)}
          </p>
        </div>
      ) : (
        <p className="listing-price-display text-2xl text-charcoal">Επίλεξε ημερομηνίες</p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openDatePicker("start")}
          className="flex min-h-12 flex-col justify-center rounded-xl border border-charcoal/12 bg-white px-3.5 py-2 text-left transition-colors hover:border-gold/35"
        >
          <span className="text-[11px] font-medium text-muted">Άφιξη</span>
          <span className="text-sm font-medium text-charcoal">
            {pendingCheckIn || displayRange
              ? formatDateKeyDisplay(pendingCheckIn ?? displayRange!.start)
              : "Επιλογή"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openDatePicker("end")}
          className="flex min-h-12 flex-col justify-center rounded-xl border border-charcoal/12 bg-white px-3.5 py-2 text-left transition-colors hover:border-gold/35"
        >
          <span className="text-[11px] font-medium text-muted">Αναχώρηση</span>
          <span className="text-sm font-medium text-charcoal">
            {displayRange ? formatDateKeyDisplay(displayRange.end) : "Επιλογή"}
          </span>
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-[11px] font-medium text-muted">Επισκέπτες</span>
        <div className="relative mt-1">
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
            className="min-h-12 w-full appearance-none rounded-xl border border-charcoal/12 bg-white px-3.5 py-2.5 text-sm font-medium text-charcoal outline-none focus:border-gold/40"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "άτομο" : "άτομα"}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </label>

      {displayRange && !rangeMeetsMinStay && minimumStayNights > 1 && (
        <p className="mt-2 text-sm text-amber-800">
          Ελάχιστη διαμονή {minimumStayNights}{" "}
          {minimumStayNights === 1 ? "νύχτα" : "νύχτες"}.
        </p>
      )}

      {displayRange &&
        rangeMeetsMinStay &&
        stayRangeHasBlockedNight(displayRange.start, displayRange.end, periods) && (
        <p className="mt-2 text-sm text-amber-800">
          Οι επιλεγμένες ημερομηνίες δεν είναι διαθέσιμες.
        </p>
      )}

      <button
        type="button"
        onClick={openAvailabilityRequest}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-white transition-colors hover:bg-gold-dark active:scale-[0.99]"
      >
        Στείλε αίτημα διαθεσιμότητας
      </button>

      {hasDirectContact && (
        <button
          type="button"
          onClick={handleContactOwner}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-charcoal/12 bg-white text-sm font-medium text-charcoal transition-colors hover:border-gold/35"
        >
          Επικοινώνησε με τον ιδιοκτήτη
        </button>
      )}

      {contactOpen && <ListingContactCard contact={contact} className="mt-3" primary />}

      <ListingPortalDisclaimer className="mt-4" />
    </>
  );

  const mobileBar = (
    <div className="mobile-inquiry-card fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => openDatePicker("start")}
          className="min-w-0 flex-1 text-left"
        >
          <p className="listing-price-display text-lg">
            {activePrice
              ? formatPublicStayPriceTotal(activePrice.total)
              : "Επίλεξε ημερομηνίες"}
          </p>
          <p className="text-[11px] text-muted">
            {displayRange
              ? `${formatDateKeyDisplay(displayRange.start)} – ${formatDateKeyDisplay(displayRange.end)}`
              : pendingCheckIn
                ? `${formatDateKeyDisplay(pendingCheckIn)} – Επιλογή αναχώρησης`
                : activePrice
                  ? formatPublicStayPriceNightsLine(activePrice.nights)
                  : "Επίλεξε ημερομηνίες"}
          </p>
        </button>
        <button
          type="button"
          onClick={openAvailabilityRequest}
          className="min-h-11 shrink-0 rounded-xl bg-gold px-4 text-sm font-semibold text-white"
        >
          Αίτημα
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        id="listing-contact"
        className={cn(
          "sticky-inquiry-card rounded-2xl border border-charcoal/10 bg-white p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)]",
          className
        )}
      >
        {cardBody}
      </div>

      {mounted ? createPortal(mobileBar, document.body) : null}

      <InterestDateRangePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={pickerValue}
        onApply={setUserSelectedRange}
        focusField={pickerFocus}
        periods={periods}
        minimumStayNights={minimumStayNights}
        listingId={listing.id}
        autoApplyOnComplete
        closeOnAutoApply
      />
    </>
  );
}
