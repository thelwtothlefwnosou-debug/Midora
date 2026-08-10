"use client";



import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { CalendarRange } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";

import {

  InterestDateRangePicker,

  type DateRangeValue,

} from "@/components/availability/InterestDateRangePicker";

import { ListingContactCard } from "@/components/listings/ListingContactCard";
import { ListingPortalNote } from "@/components/listings/ListingPortalNote";

import {

  formatDateKeyDisplay,

  meetsMinimumStayNights,

  normalizeDateRange,

  stayNightsBetween,

} from "@/lib/availability-calendar";

import { useListingInterest } from "@/components/listings/ListingInterestContext";

import type { ListingPublicContact } from "@/lib/listing-contact";

import type { ListingPublicDetail } from "@/lib/types";

import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

import { resolveMinimumStayNights } from "@/lib/listing-rental-modes";

import { formatInterestRangeLabel } from "@/lib/search-interest-dates";

import { computeIndicativeStayPrice } from "@/lib/listing-short-term-price";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";



type Props = {

  listing: ListingPublicDetail;

  periods: ListingUnavailablePeriod[];

  contact: ListingPublicContact;

  className?: string;

};



export function ShortTermPriceCard({

  listing,

  periods,

  contact,

  className,

}: Props) {

  const { openInterest } = useListingInterest();
  const tCommon = useTranslations("Common");
  const tListing = useTranslations("Listing");
  const tListingLabels = useTranslations("Listing.labels");

  const searchParams = useSearchParams();

  const [appliedRange, setAppliedRange] = useState<DateRangeValue>(null);

  const [pickerOpen, setPickerOpen] = useState(false);

  const [guests, setGuests] = useState(

    Math.min(listing.max_guests ?? 2, listing.included_guests ?? 2) || 2

  );



  useEffect(() => {

    const from =

      searchParams.get("interestFrom")?.trim() ||

      searchParams.get("start")?.trim() ||

      "";

    const to =

      searchParams.get("interestTo")?.trim() ||

      searchParams.get("end")?.trim() ||

      "";

    const guestsRaw = searchParams.get("guests")?.trim();



    if (from && to) {

      setAppliedRange({ start: from, end: to });

    }



    if (guestsRaw) {

      const parsed = parseInt(guestsRaw, 10);

      if (Number.isFinite(parsed) && parsed >= 1) {

        setGuests(Math.min(parsed, listing.max_guests ?? 16));

      }

    }

  }, [listing.max_guests, searchParams]);



  const minimumStayNights = resolveMinimumStayNights(listing);

  const maxGuests = listing.max_guests ?? 16;

  const nightPrice = listing.price_per_night ?? 0;



  const range = useMemo(() => {

    if (!appliedRange?.start || !appliedRange.end) return null;

    return normalizeDateRange(appliedRange.start, appliedRange.end);

  }, [appliedRange]);



  const rangeMeetsMinStay =

    range != null &&

    meetsMinimumStayNights(range.start, range.end, minimumStayNights);



  const indicative = useMemo(() => {

    if (!range || !rangeMeetsMinStay) return null;

    return computeIndicativeStayPrice(

      listing,

      listing.price_rules,

      range.start,

      range.end,

      guests

    );

  }, [listing, range, rangeMeetsMinStay, guests]);



  function openContact() {

    if (range && !rangeMeetsMinStay) return;

    const guestLabel = `${guests} ${guests === 1 ? tCommon("person") : tCommon("peoplePlural")}`;

    if (range) {

      openInterest({

        guests,

        interestStartDate: range.start,

        interestEndDate: range.end,

        timingNote: formatInterestRangeLabel(range.start, range.end),

        message: tListing("priceCard.interestGuestsMessage", {
          range: formatInterestRangeLabel(range.start, range.end),
          guests: guestLabel,
        }),

      });

    } else {

      openInterest({

        guests,

        message: tListing("priceCard.interestSimpleMessage", { guests: guestLabel }),

      });

    }

    setPickerOpen(false);

  }



  const dateTrigger = (

    <button

      type="button"

      onClick={() => setPickerOpen(true)}

      className="mt-4 flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left shadow-soft transition-colors hover:border-gold/35"

    >

      <CalendarRange className="h-5 w-5 shrink-0 text-gold" />

      <div className="min-w-0 flex-1">

        <p className="text-xs font-medium tracking-wide text-muted uppercase">

          {tListing("priceCard.interestDates")}

        </p>

        {range ? (

          <>

            <p className="mt-0.5 text-sm font-medium text-charcoal">

              {formatDateKeyDisplay(range.start)} – {formatDateKeyDisplay(range.end)}

            </p>

            <p className="text-xs text-gold-dark">

              {tListing("nightsCount", { count: stayNightsBetween(range.start, range.end) })}

            </p>

          </>

        ) : (

          <p className="mt-0.5 text-sm text-muted">{tListing("priceCard.selectDatesHint")}</p>

        )}

      </div>

    </button>

  );



  const picker = (

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

  );



  return (

    <>

      {/* Desktop sidebar */}

      <div className={cn("hidden lg:block", className)} id="listing-contact">

        <div className="sticky top-28">

          <GlassCard glow className="p-6">

            <h3 className="listing-section-title text-lg sm:text-lg">

              {tListing("priceCard.sectionTitle")}

            </h3>



            {indicative ? (

              <>

                <p className="listing-price-display mt-3 text-2xl sm:text-[1.75rem]">

                  €{indicative.total.toLocaleString("el-GR")}

                </p>

                <p className="mt-1 text-sm text-muted">

                  {tListing("nightsCount", { count: indicative.nights })} · €

                  {nightPrice.toLocaleString("el-GR")} {tCommon("perNight")}

                  {indicative.nights > 1

                    ? ` (${indicative.nights}×€${nightPrice.toLocaleString("el-GR")})`

                    : ""}

                </p>

              </>

            ) : (

              <p className="listing-price-display mt-3 text-2xl">

                {tListing("priceCard.fromPricePrefix")} €{nightPrice.toLocaleString("el-GR")}{" "}

                <span className="text-base font-medium text-muted">{tCommon("perNight")}</span>

              </p>

            )}



            {listing.included_guests != null && (

              <p className="mt-1 text-sm text-muted">

                {tListing("priceCard.guestsIncludedInPrice", { count: listing.included_guests })}

              </p>

            )}

            {listing.extra_guest_fee_per_night != null &&

              listing.extra_guest_fee_per_night > 0 && (

                <p className="text-sm text-muted">

                  {tListing("priceCard.extraGuestFeeLine", {
                    fee: `€${listing.extra_guest_fee_per_night.toLocaleString("el-GR")}`,
                    unit: tCommon("perNight"),
                  })}

                </p>

              )}



            {indicative && indicative.extraGuestNights > 0 && (

              <p className="mt-1 text-xs text-muted">

                {tListing("priceCard.extraGuestFeeIncludedNote")}

              </p>

            )}



            {range && !rangeMeetsMinStay && minimumStayNights > 1 && (

              <p className="mt-2 text-sm text-amber-800">

                {tListing("minStayNights", { count: minimumStayNights })}

              </p>

            )}



            {dateTrigger}



            <label className="mt-4 block text-sm">

              <span className="text-xs font-medium tracking-wide text-muted uppercase">

                {tListing("guests")}

              </span>

              <select

                value={guests}

                onChange={(e) => setGuests(parseInt(e.target.value, 10))}

                className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"

              >

                {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (

                  <option key={n} value={n}>

                    {tListingLabels("guestsSummary", { count: n })}

                  </option>

                ))}

              </select>

            </label>



            {indicative && indicative.ruleLabel && (

              <p className="mt-2 text-xs text-muted">

                {tListing("priceCard.specialPeriod", { label: indicative.ruleLabel })}

              </p>

            )}



            <p className="mt-3 text-xs leading-relaxed text-muted">
              {tListing("priceCard.availabilityConfirmedNote")}
            </p>

            <button
              type="button"
              onClick={openContact}
              className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
            >
              {tCommon("expressInterest")}
            </button>

            <ListingContactCard contact={contact} primary className="mt-4" />
            <ListingPortalNote className="mt-4" />

          </GlassCard>

        </div>

      </div>



      {/* Mobile bottom bar */}

      <div

        className={cn(

          "midora-above-mnav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden",

          className

        )}

      >

        <div className="midora-above-mnav__safe mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">

          <button

            type="button"

            onClick={() => setPickerOpen(true)}

            className="min-w-0 flex-1 text-left"

          >

            {indicative ? (

              <>

                <p className="listing-price-display text-lg">

                  €{indicative.total.toLocaleString("el-GR")}

                </p>

                <p className="text-[11px] text-muted">

                  {tListing("nightsCount", { count: indicative.nights })} · €

                  {nightPrice.toLocaleString("el-GR")} {tCommon("perNight")}

                </p>

              </>

            ) : (

              <>

                <p className="listing-price-display text-lg">

                  {tListing("priceCard.fromPricePrefix")} €{nightPrice.toLocaleString("el-GR")} {tCommon("perNight")}

                </p>

                <p className="text-[11px] text-muted">

                  {range

                    ? `${formatDateKeyDisplay(range.start)} – ${formatDateKeyDisplay(range.end)}`

                    : tListing("priceCard.mobileDatesPrompt")}

                </p>

              </>

            )}

          </button>

          <button

            type="button"

            onClick={() => {

              if (range && rangeMeetsMinStay) {

                openContact();

                return;

              }

              if (contact.allowPhone && contact.phone) {

                document.getElementById("listing-contact")?.scrollIntoView({

                  behavior: "smooth",

                  block: "start",

                });

                return;

              }

              setPickerOpen(true);

            }}

            className="min-h-11 shrink-0 rounded-xl bg-gold px-5 text-sm font-semibold text-white"

          >

            {range && rangeMeetsMinStay

              ? tCommon("expressInterest")

              : contact.allowPhone && contact.phone

                ? tCommon("contactPhone")

                : tListing("selectDates")}

          </button>

        </div>

      </div>



      {picker}

    </>

  );

}


