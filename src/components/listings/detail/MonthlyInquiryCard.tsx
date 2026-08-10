"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { MonthInput } from "@/components/ui/MonthInput";
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
  const t = useTranslations("Listing");
  const tCommon = useTranslations("Common");
  const tLegal = useTranslations("Legal.shared");
  const { openInterest } = useListingInterest();
  const minStayMonths = resolveMinimumStayMonths(listing);
  const durationOptions = monthlyDurationOptions(minStayMonths, (key, values) =>
    t(key, values)
  );
  const minMonth = minSearchMonthValue();

  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [durationMonths, setDurationMonths] = useState(minStayMonths);
  const includedDefault =
    listing.monthly_included_people && listing.monthly_included_people > 0
      ? listing.monthly_included_people
      : Math.min(2, listing.max_guests ?? 2);
  const [guests, setGuests] = useState(includedDefault);
  const [contactOpen, setContactOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const activeDuration = Math.max(minStayMonths, durationMonths);
  const maxGuests = listing.monthly_max_people ?? listing.max_guests ?? 16;

  const price = useMemo(
    () => publicPricePrimary(listing, "monthly", guests),
    [listing, guests]
  );

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
      message: t("inquiry.prefillMonthlySimple"),
    });
  }

  const tags = [
    listing.furnished && t("furnished"),
    listing.utilities_included && tCommon("utilitiesIncluded"),
    listing.pets_allowed && t("petsAllowed"),
    minStayMonths > 0 && t("minStayMonthsShort", { count: minStayMonths }),
  ].filter(Boolean) as string[];

  function openRentalRequest() {
    const durationLabel =
      durationOptions.find((o) => o.value === activeDuration)?.label ??
      t("monthsCount", { count: activeDuration });
    // Prefer translated duration for known option values
    const translatedDuration =
      activeDuration === 12
        ? t("monthsPlus", { count: 12 })
        : t("monthsCount", { count: activeDuration });
    const durationText = durationOptions.some((o) => o.value === activeDuration)
      ? translatedDuration
      : durationLabel;
    openInterest({
      guests,
      interestStartMonth: startMonth,
      interestDurationMonths: activeDuration,
      timingNote: formatMonthLabel(startMonth),
      duration: durationText,
      message: t("inquiry.prefillMonthlyWithDates", {
        month: formatMonthLabel(startMonth),
        duration: durationText,
      }),
    });
  }

  const cardBody = (
    <>
      <p className="listing-price-display text-2xl text-charcoal">
        {price.display}
      </p>
      {price.subtext ? (
        <p className="mt-1 text-sm text-charcoal/65">{price.subtext}</p>
      ) : null}
      <p className="mt-2 text-sm text-charcoal/65">{t("finalPriceOwner")}</p>

      {hostName && (
        <p className="mt-3 text-sm text-charcoal/70">{hostName}</p>
      )}

      <label className="mt-5 block">
        <span className="text-[11px] font-medium text-muted">{t("startMonth")}</span>
        <MonthInput
          min={minMonth}
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl border border-charcoal/12 px-3.5 text-sm font-medium outline-none focus:border-gold/40"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-medium text-muted">{t("duration")}</span>
        <div className="relative mt-1">
          <select
            value={activeDuration}
            onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
            className="min-h-12 w-full appearance-none rounded-xl border border-charcoal/12 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-gold/40"
          >
            {durationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value === 12
                  ? t("monthsPlus", { count: 12 })
                  : t("monthsCount", { count: o.value })}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-medium text-muted">{t("peopleStaying")}</span>
        <div className="relative mt-1">
          <select
            value={Math.min(guests, maxGuests)}
            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
            className="min-h-12 w-full appearance-none rounded-xl border border-charcoal/12 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-gold/40"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? tCommon("person") : tCommon("peoplePlural")}
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
        {t("sendRentalRequest")}
      </button>

      <button
        type="button"
        onClick={() =>
          openInterest({
            intent: "message",
            rentalMode: "monthly",
            guests,
            interestStartMonth: startMonth,
            interestDurationMonths: activeDuration,
            message: "",
          })
        }
        className="mt-3 w-full text-center text-sm font-medium text-charcoal/80 underline-offset-2 hover:text-charcoal hover:underline"
      >
        {tLegal("stickyMessageLinkMonthly")}
      </button>

      {hasDirectContact && (
        <button
          type="button"
          onClick={handleContactOwner}
          className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl border border-charcoal/10 bg-white text-sm font-medium text-charcoal/70 transition-colors hover:border-gold/35"
        >
          {t("otherContactMethods")}
        </button>
      )}

      {contactOpen && <ListingContactCard contact={contact} className="mt-3" primary />}

      <ListingPortalDisclaimer className="mt-4" />
    </>
  );

  const mobileBar = (
    <div className="mobile-inquiry-card midora-above-mnav fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="midora-above-mnav__safe mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        <div className="min-w-0 flex-1">
          <p className="listing-price-display text-lg">{price.display}</p>
          <p className="text-[11px] text-muted">
            {price.subtext ?? t("monthlyMidterm")}
          </p>
        </div>
        <button
          type="button"
          onClick={openRentalRequest}
          className="min-h-11 shrink-0 rounded-xl bg-gold px-4 text-sm font-semibold text-white"
        >
          {t("request")}
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
