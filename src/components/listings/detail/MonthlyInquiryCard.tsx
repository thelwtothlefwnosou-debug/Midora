"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { ListingContactCard } from "@/components/listings/ListingContactCard";
import { ListingPortalDisclaimer } from "@/components/listings/detail/ListingPortalDisclaimer";
import { useListingInterest } from "@/components/listings/ListingInterestContext";
import type { ListingPublicContact } from "@/lib/listing-contact";
import type { ListingPublicDetail } from "@/lib/types";
import {
  monthlyDurationOptions,
  resolveMinimumStayMonths,
  publicPricePrimary,
} from "@/lib/listing-rental-modes";
import { formatMonthLabel } from "@/lib/search-interest-dates";
import { minSearchMonthValue } from "@/lib/search-date-validation";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  contact: ListingPublicContact;
  hostName?: string | null;
  className?: string;
};

export function MonthlyInquiryCard({
  listing,
  contact,
  hostName,
  className,
}: Props) {
  const { openInterest } = useListingInterest();
  const minStayMonths = resolveMinimumStayMonths(listing);
  const durationOptions = monthlyDurationOptions(minStayMonths);
  const price = publicPricePrimary(listing, "monthly");
  const minMonth = minSearchMonthValue();

  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [durationMonths, setDurationMonths] = useState(minStayMonths);
  const [guests, setGuests] = useState(listing.max_guests ?? 2);
  const [contactOpen, setContactOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const activeDuration = Math.max(minStayMonths, durationMonths);
  const maxGuests = listing.max_guests ?? 16;

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
      message:
        "Καλησπέρα, ενδιαφέρομαι για το ακίνητο. Θα ήθελα περισσότερες πληροφορίες για διαθεσιμότητα και όρους μίσθωσης.",
    });
  }

  const tags = [
    listing.furnished && "Επιπλωμένο",
    listing.utilities_included && "Λογαριασμοί περιλαμβάνονται",
    listing.pets_allowed && "Επιτρέπονται κατοικίδια",
    minStayMonths > 0 && `Ελάχ. ${minStayMonths} μήνες`,
  ].filter(Boolean) as string[];

  function openRentalRequest() {
    const durationLabel =
      durationOptions.find((o) => o.value === activeDuration)?.label ??
      `${activeDuration} μήνες`;
    openInterest({
      guests,
      interestStartMonth: startMonth,
      interestDurationMonths: activeDuration,
      timingNote: formatMonthLabel(startMonth),
      duration: durationLabel,
      message: `Καλησπέρα, ενδιαφέρομαι για το ακίνητο από ${formatMonthLabel(startMonth)} για διάρκεια ${durationLabel}. Θα ήθελα περισσότερες πληροφορίες για διαθεσιμότητα και όρους μίσθωσης.`,
    });
  }

  const cardBody = (
    <>
      <p className="listing-price-display text-2xl text-charcoal">
        {price.display}
      </p>
      <p className="mt-2 text-sm text-charcoal/65">
        Η τελική διαθεσιμότητα και τιμή επιβεβαιώνονται από τον ιδιοκτήτη.
      </p>

      {hostName && (
        <p className="mt-3 text-sm text-charcoal/70">{hostName}</p>
      )}

      <label className="mt-5 block">
        <span className="text-[11px] font-medium text-muted">Μήνας έναρξης</span>
        <input
          type="month"
          min={minMonth}
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl border border-charcoal/12 px-3.5 text-sm font-medium outline-none focus:border-gold/40"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-medium text-muted">Διάρκεια</span>
        <div className="relative mt-1">
          <select
            value={activeDuration}
            onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
            className="min-h-12 w-full appearance-none rounded-xl border border-charcoal/12 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-gold/40"
          >
            {durationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-medium text-muted">Άτομα</span>
        <div className="relative mt-1">
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
            className="min-h-12 w-full appearance-none rounded-xl border border-charcoal/12 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-gold/40"
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

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-charcoal/10 bg-sand/40 px-2.5 py-1 text-xs font-medium text-charcoal/75"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={openRentalRequest}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-white transition-colors hover:bg-gold-dark active:scale-[0.99]"
      >
        Στείλε αίτημα μίσθωσης
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
        <div className="min-w-0 flex-1">
          <p className="listing-price-display text-lg">{price.display}</p>
          <p className="text-[11px] text-muted">Μηνιαία / μεσοπρόθεσμη</p>
        </div>
        <button
          type="button"
          onClick={openRentalRequest}
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
    </>
  );
}
