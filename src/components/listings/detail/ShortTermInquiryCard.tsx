"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { InterestDateRangePicker } from "@/components/availability/InterestDateRangePicker";
import { ListingContactCard } from "@/components/listings/ListingContactCard";
import { ListingPortalDisclaimer } from "@/components/listings/detail/ListingPortalDisclaimer";
import { useListingInquiryDates } from "@/components/listings/detail/ListingInquiryDatesContext";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import type { ListingPublicContact } from "@/lib/listing-contact";
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
    appliedRange,
    setAppliedRange,
    guests,
    setGuests,
    range,
    pendingCheckIn,
    rangeMeetsMinStay,
    minimumStayNights,
    maxGuests,
  } = useListingInquiryDates();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

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

  const nightPrice = listing.price_per_night ?? 0;
  const guestLabel = `${guests} ${guests === 1 ? "άτομο" : "άτομα"}`;

  function openAvailabilityRequest() {
    if (range && !rangeMeetsMinStay) return;
    if (range) {
      openInterest({
        guests,
        interestStartDate: range.start,
        interestEndDate: range.end,
        timingNote: formatInterestRangeLabel(range.start, range.end),
        message: `Καλησπέρα, ενδιαφέρομαι για το ακίνητο από ${formatInterestRangeLabel(range.start, range.end)} για ${guestLabel}. Θα ήθελα να επιβεβαιώσω τη διαθεσιμότητα και την τελική τιμή.`,
      });
    } else {
      openInterest({
        guests,
        message: `Καλησπέρα, ενδιαφέρομαι για το ακίνητο για ${guestLabel}. Θα ήθελα να επιβεβαιώσω τη διαθεσιμότητα και την τελική τιμή.`,
      });
    }
  }

  const cardBody = (
    <>
      <h3 className="font-display text-lg font-semibold text-charcoal">
        Ενδιαφέρεστε για αυτό το κατάλυμα;
      </h3>
      <p className="listing-price-display mt-3 text-2xl text-charcoal">
        Από €{nightPrice.toLocaleString("el-GR")}{" "}
        <span className="text-base font-medium text-muted">/ βράδυ</span>
      </p>
      <p className="mt-2 text-sm text-charcoal/65">
        Η τελική διαθεσιμότητα και τιμή επιβεβαιώνονται από τον ιδιοκτήτη.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-h-12 flex-col justify-center rounded-xl border border-charcoal/12 bg-white px-3.5 py-2 text-left transition-colors hover:border-gold/35"
        >
          <span className="text-[11px] font-medium text-muted">Άφιξη</span>
          <span className="text-sm font-medium text-charcoal">
            {pendingCheckIn || range
              ? formatDateKeyDisplay(pendingCheckIn ?? range!.start)
              : "Επιλογή"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-h-12 flex-col justify-center rounded-xl border border-charcoal/12 bg-white px-3.5 py-2 text-left transition-colors hover:border-gold/35"
        >
          <span className="text-[11px] font-medium text-muted">Αναχώρηση</span>
          <span className="text-sm font-medium text-charcoal">
            {range ? formatDateKeyDisplay(range.end) : "Επιλογή"}
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

      {range && !rangeMeetsMinStay && minimumStayNights > 1 && (
        <p className="mt-2 text-sm text-amber-800">
          Ελάχιστη διαμονή {minimumStayNights}{" "}
          {minimumStayNights === 1 ? "νύχτα" : "νύχτες"}.
        </p>
      )}

      {range && rangeMeetsMinStay && (
        <p className="mt-2 text-xs text-muted">
          {stayNightsBetween(range.start, range.end)}{" "}
          {stayNightsBetween(range.start, range.end) === 1 ? "νύχτα" : "νύχτες"} ·
          ενδεικτική επιλογή
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

  return (
    <>
      <div className={cn("hidden lg:block", className)} id="listing-contact">
        <div className="sticky top-28 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)]">
          {cardBody}
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden",
          className
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="listing-price-display text-lg">
              Από €{nightPrice.toLocaleString("el-GR")} / βράδυ
            </p>
            <p className="text-[11px] text-muted">
              {range
                ? `${formatDateKeyDisplay(range.start)} – ${formatDateKeyDisplay(range.end)}`
                : pendingCheckIn
                  ? `${formatDateKeyDisplay(pendingCheckIn)} – Επιλογή αναχώρησης`
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

      <InterestDateRangePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={appliedRange}
        onApply={setAppliedRange}
        periods={periods}
        minimumStayNights={minimumStayNights}
        listingId={listing.id}
        showLegend
        autoApplyOnComplete
        closeOnAutoApply
      />
    </>
  );
}
