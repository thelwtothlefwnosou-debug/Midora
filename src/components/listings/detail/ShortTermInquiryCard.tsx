"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
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
  const t = useTranslations("Listing");
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const tLegal = useTranslations("Legal.shared");
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
      periods,
      locale
    );
  }, [displayRange, listing, priceRules, guests, periods, locale]);

  const pickerValue = userSelectedRange;

  function openDatePicker(field: DateRangeFocusField) {
    setPickerFocus(field);
    setPickerOpen(true);
  }

  const guestLabel = `${guests} ${guests === 1 ? tCommon("person") : tCommon("peoplePlural")}`;
  const hasDisplayPrice = Boolean(displayRange && rangeMeetsMinStay && displayPrice);

  function buildInquiryMessage(): string {
    const nights =
      displayRange && rangeMeetsMinStay
        ? stayNightsBetween(displayRange.start, displayRange.end)
        : null;
    const parts = [
      t("inquiry.prefillShortIntro", {
        range: displayRange
          ? t("inquiry.prefillShortRange", {
              range: formatInterestRangeLabel(displayRange.start, displayRange.end),
            })
          : "",
        guests: guestLabel,
      }),
    ];
    if (nights) {
      parts.push(t("inquiry.prefillDurationNights", { count: nights }));
    }
    if (displayPrice) {
      parts.push(
        t("inquiry.prefillCalendarPrice", {
          amount: displayPrice.total.toLocaleString("el-GR"),
        })
      );
      if (displayPrice.discountLabel) {
        parts.push(`${displayPrice.discountLabel}.`);
      }
    }
    parts.push(t("inquiry.prefillConfirm"));
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
      message: t("inquiry.prefillShortSimple", { guests: guestLabel }),
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
            {formatPublicStayPriceTotal(activePrice.total, locale)}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {formatPublicStayPriceNightsLine(activePrice.nights, locale)}
          </p>
        </div>
      ) : (
        <p className="listing-price-display text-2xl text-charcoal">{t("selectDates")}</p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openDatePicker("start")}
          className="flex min-h-12 flex-col justify-center rounded-xl border border-charcoal/12 bg-white px-3.5 py-2 text-left transition-colors hover:border-gold/35"
        >
          <span className="text-[11px] font-medium text-muted">{t("checkIn")}</span>
          <span className="text-sm font-medium text-charcoal">
            {pendingCheckIn || displayRange
              ? formatDateKeyDisplay(pendingCheckIn ?? displayRange!.start)
              : t("select")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openDatePicker("end")}
          className="flex min-h-12 flex-col justify-center rounded-xl border border-charcoal/12 bg-white px-3.5 py-2 text-left transition-colors hover:border-gold/35"
        >
          <span className="text-[11px] font-medium text-muted">{t("checkOut")}</span>
          <span className="text-sm font-medium text-charcoal">
            {displayRange ? formatDateKeyDisplay(displayRange.end) : t("select")}
          </span>
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-[11px] font-medium text-muted">{t("guests")}</span>
        <div className="relative mt-1">
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
            className="min-h-12 w-full appearance-none rounded-xl border border-charcoal/12 bg-white px-3.5 py-2.5 text-sm font-medium text-charcoal outline-none focus:border-gold/40"
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

      {displayRange && !rangeMeetsMinStay && minimumStayNights > 1 && (
        <p className="mt-2 text-sm text-amber-800">
          {t("minStayNights", { count: minimumStayNights })}
        </p>
      )}

      {displayRange &&
        rangeMeetsMinStay &&
        stayRangeHasBlockedNight(displayRange.start, displayRange.end, periods) && (
        <p className="mt-2 text-sm text-amber-800">
          {t("datesUnavailable")}
        </p>
      )}

      <button
        type="button"
        onClick={openAvailabilityRequest}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-white transition-colors hover:bg-gold-dark active:scale-[0.99]"
      >
        {t("sendAvailabilityRequest")}
      </button>

      <button
        type="button"
        onClick={() =>
          openInterest({
            intent: "message",
            rentalMode: "short_term",
            guests,
            interestStartDate: displayRange?.start,
            interestEndDate: displayRange?.end,
            message: "",
          })
        }
        className="mt-3 w-full text-center text-sm font-medium text-charcoal/80 underline-offset-2 hover:text-charcoal hover:underline"
      >
        {tLegal("stickyMessageLinkShort")}
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
    <div className="mobile-inquiry-card fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => openDatePicker("start")}
          className="min-w-0 flex-1 text-left"
        >
          <p className="listing-price-display text-lg">
            {activePrice
              ? formatPublicStayPriceTotal(activePrice.total, locale)
              : t("selectDates")}
          </p>
          <p className="text-[11px] text-muted">
            {displayRange
              ? `${formatDateKeyDisplay(displayRange.start)} – ${formatDateKeyDisplay(displayRange.end)}`
              : pendingCheckIn
                ? `${formatDateKeyDisplay(pendingCheckIn)} – ${t("selectCheckout")}`
                : activePrice
                  ? formatPublicStayPriceNightsLine(activePrice.nights, locale)
                  : t("selectDates")}
          </p>
        </button>
        <button
          type="button"
          onClick={openAvailabilityRequest}
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
        showLegend
        unavailableDayStyle="premium-blocked"
      />
    </>
  );
}
