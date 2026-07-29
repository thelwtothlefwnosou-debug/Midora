"use client";

import { useId, useRef } from "react";
import { Calendar, Clock, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type DateRangeFocusField,
  type DateRangeValue,
} from "@/components/availability/InterestDateRangePicker";
import { InterestDateRangePickerLazy as InterestDateRangePicker } from "@/components/availability/InterestDateRangePickerLazy";
import {
  EMPTY_GUEST_COUNTS,
  GuestPicker,
  guestCountsToSearchTotal,
  parseGuestSearchParam,
  type GuestCounts,
} from "@/components/search/GuestPicker";
import { SearchInteractiveTile, HeroSearchField } from "@/components/search/SearchInteractiveTile";
import { MonthInput } from "@/components/ui/MonthInput";
import { MID_TERM_DURATION_OPTIONS, midTermDurationLabel } from "@/lib/search-interest-dates";
import {
  type ActiveSearchField,
  type GuestSearchLabels,
  isCompleteDateRange,
  formatGuestSearchLabel,
  formatSearchCheckInLabel,
  formatSearchCheckOutLabel,
  petsCountToParam,
} from "@/lib/guided-search";
import { isPastMonthInAthens } from "@/lib/dates-athens";
import { minSearchMonthValue } from "@/lib/search-date-validation";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

const heroInputClass =
  "w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none";

export type GuidedSearchState = {
  dateRange: DateRangeValue;
  guestCounts: GuestCounts;
  hasGuestSelection: boolean;
  startMonth: string;
  durationMonths: string;
};

export const EMPTY_GUIDED_SEARCH: GuidedSearchState = {
  dateRange: null,
  guestCounts: { ...EMPTY_GUEST_COUNTS },
  hasGuestSelection: false,
  startMonth: "",
  durationMonths: "",
};

type GuidedFlowProps = {
  activeField: ActiveSearchField;
  onActiveFieldChange: (field: ActiveSearchField) => void;
  datePickerOpen: boolean;
  onDatePickerOpenChange: (open: boolean) => void;
  guestPickerOpen: boolean;
  onGuestPickerOpenChange: (open: boolean) => void;
  /** Anchor popovers below the search bar (hero + listings page). */
  searchShellRef?: React.RefObject<HTMLElement | null>;
  /** Keep popover open when clicking search actions outside the shell. */
  ignoreRefs?: React.RefObject<HTMLElement | null>[];
};

type Props = {
  rentalType: RentalType;
  variant?: "hero" | "search";
  state: GuidedSearchState;
  onStateChange: (patch: Partial<GuidedSearchState>) => void;
  guidedFlow: GuidedFlowProps;
  partialDateHint?: string | null;
  defaults?: {
    interestFrom?: string;
    interestTo?: string;
    startMonth?: string;
    durationMonths?: string;
    guests?: string;
    pets?: string;
  };
};

const searchFieldButtonClass =
  "flex min-h-[22px] w-full items-center border-0 bg-transparent p-0 text-left text-[15px] leading-snug text-charcoal outline-none";

function useGuestSearchLabels(): GuestSearchLabels {
  const tSearch = useTranslations("Search");
  const t = useTranslations("Search.guestPicker");
  return {
    empty: tSearch("addGuests"),
    guestOne: t("guestOne"),
    guestOther: t("guestOther"),
    petOne: t("petOne"),
    petOther: t("petOther"),
    childOne: t("childOne"),
    childOther: t("childOther"),
    infantOne: t("infantOne"),
    infantOther: t("infantOther"),
    fallback: t("fallback"),
  };
}

function ShortTermGuidedFields({
  variant,
  state,
  onStateChange,
  guidedFlow,
  partialDateHint,
}: Omit<Props, "rentalType" | "defaults"> & { rentalType: "short_term" }) {
  const t = useTranslations("Search");
  const isSearch = variant === "search";
  const checkInAnchorRef = useRef<HTMLDivElement>(null);
  const checkOutAnchorRef = useRef<HTMLDivElement>(null);
  const guestsAnchorRef = useRef<HTMLDivElement>(null);
  const {
    activeField,
    onActiveFieldChange,
    datePickerOpen,
    onDatePickerOpenChange,
    guestPickerOpen,
    onGuestPickerOpenChange,
    searchShellRef,
    ignoreRefs,
  } = guidedFlow;

  const datesSegmentActive =
    datePickerOpen ||
    activeField === "dates" ||
    activeField === "checkIn" ||
    activeField === "checkOut";

  const datePlaceholder = t("when");
  const guestSearchLabels = useGuestSearchLabels();
  const checkInLabel = formatSearchCheckInLabel(state.dateRange, datePlaceholder);
  const checkOutLabel = formatSearchCheckOutLabel(state.dateRange, datePlaceholder);
  const guestLabel = formatGuestSearchLabel(
    state.guestCounts,
    state.hasGuestSelection,
    guestSearchLabels
  );

  const dateFocus: DateRangeFocusField =
    activeField === "checkOut" ? "end" : "start";

  function openDates(focus: DateRangeFocusField) {
    onActiveFieldChange(focus === "end" ? "checkOut" : "dates");
    onGuestPickerOpenChange(false);
    onDatePickerOpenChange(true);
    // Avoid location input stealing focus and immediately closing the calendar.
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.closest("input, textarea")
    ) {
      document.activeElement.blur();
    }
  }

  function applyDateRange(next: DateRangeValue) {
    onStateChange({ dateRange: next });
    if (isCompleteDateRange(next)) {
      onGuestPickerOpenChange(false);
      onDatePickerOpenChange(false);
      onActiveFieldChange(null);
    }
  }

  function applyGuests(next: GuestCounts) {
    const hasSelection =
      next.adults + next.children > 0 || next.infants > 0 || next.pets > 0;
    onStateChange({
      guestCounts: next,
      hasGuestSelection: hasSelection,
    });
    onGuestPickerOpenChange(false);
    onActiveFieldChange(null);
  }

  const hiddenInputs = (
    <>
      <input type="hidden" name="interestFrom" value={state.dateRange?.start ?? ""} />
      <input type="hidden" name="interestTo" value={state.dateRange?.end ?? ""} />
      <input
        type="hidden"
        name="guests"
        value={
          state.hasGuestSelection
            ? String(guestCountsToSearchTotal(state.guestCounts))
            : ""
        }
      />
      <input
        type="hidden"
        name="pets"
        value={petsCountToParam(state.guestCounts, state.hasGuestSelection)}
      />
    </>
  );

  const popoverAnchor = searchShellRef ?? checkInAnchorRef;

  const datePicker = (
    <InterestDateRangePicker
      open={datePickerOpen}
      onOpenChange={(open) => {
        onDatePickerOpenChange(open);
        if (!open) onActiveFieldChange(null);
      }}
      value={state.dateRange}
      onApply={applyDateRange}
      focusField={dateFocus}
      showLegend={false}
      showPrices={false}
      autoApplyOnComplete
      closeOnAutoApply
      title=""
      subtitle=""
      clearLabel={t("clearDates")}
      presentation="popover"
      anchorRef={popoverAnchor}
      ignoreRefs={ignoreRefs}
    />
  );

  const guestPicker = (
    <GuestPicker
      open={guestPickerOpen}
      onOpenChange={(open) => {
        onGuestPickerOpenChange(open);
        if (!open) onActiveFieldChange(null);
      }}
      value={state.guestCounts}
      onApply={applyGuests}
      showInfants
      presentation="popover"
      anchorRef={guestsAnchorRef}
      ignoreRefs={ignoreRefs}
      onClear={() =>
        onStateChange({
          guestCounts: { ...EMPTY_GUEST_COUNTS },
          hasGuestSelection: false,
        })
      }
    />
  );

  const checkInSegment = (
    <div
      ref={checkInAnchorRef}
      className={cn(
        isSearch
          ? cn(
              "listings-search-segment min-w-0 flex-1 sm:min-w-[5.5rem]",
              "listings-search-segment--divided",
              datesSegmentActive && "listings-search-segment--active"
            )
          : cn(
              "home-hero-search-cell home-search-field relative w-full text-left transition-colors hover:bg-[#faf6ef]",
              datesSegmentActive &&
                "z-[1] bg-[#f7f0e6] ring-1 ring-inset ring-gold/55"
            )
      )}
    >
      {isSearch ? (
        <>
          <span className="listings-search-segment__label">{t("checkIn")}</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openDates("start")}
            className={cn(
              searchFieldButtonClass,
              checkInLabel === datePlaceholder && "text-charcoal/45"
            )}
          >
            {checkInLabel}
          </button>
        </>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openDates("start")}
          className="flex h-full w-full items-center gap-3 text-left"
        >
          <Calendar
            className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
            strokeWidth={1.75}
          />
          <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="home-search-field-label">{t("checkIn")}</span>
            <span
              className={cn(
                "text-sm leading-snug text-charcoal",
                checkInLabel === datePlaceholder && "text-muted/55"
              )}
            >
              {checkInLabel}
            </span>
          </div>
        </button>
      )}
    </div>
  );

  const checkOutSegment = (
    <div
      ref={checkOutAnchorRef}
      className={cn(
        isSearch
          ? cn(
              "listings-search-segment min-w-0 flex-1 sm:min-w-[5.5rem]",
              "listings-search-segment--divided",
              datesSegmentActive && "listings-search-segment--active"
            )
          : cn(
              "home-hero-search-cell home-search-field relative w-full text-left transition-colors hover:bg-[#faf6ef]",
              datesSegmentActive &&
                "z-[1] bg-[#f7f0e6] ring-1 ring-inset ring-gold/55"
            )
      )}
    >
      {isSearch ? (
        <>
          <span className="listings-search-segment__label">{t("checkOut")}</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openDates("end")}
            className={cn(
              searchFieldButtonClass,
              checkOutLabel === datePlaceholder && "text-charcoal/45"
            )}
          >
            {checkOutLabel}
          </button>
          {partialDateHint ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted">{partialDateHint}</p>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openDates("end")}
          className="flex h-full w-full items-center gap-3 text-left"
        >
          <Calendar
            className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
            strokeWidth={1.75}
          />
          <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="home-search-field-label">{t("checkOut")}</span>
            <span
              className={cn(
                "text-sm leading-snug text-charcoal",
                checkOutLabel === datePlaceholder && "text-muted/55"
              )}
            >
              {checkOutLabel}
            </span>
          </div>
        </button>
      )}
    </div>
  );

  const guestsSegment = (
    <div
      ref={guestsAnchorRef}
      className={cn(
        isSearch
          ? cn(
              "listings-search-segment min-w-0 shrink-0 sm:min-w-[6.5rem] sm:max-w-[9rem]",
              "listings-search-segment--divided",
              activeField === "guests" && "listings-search-segment--active"
            )
          : cn(
              "home-hero-search-cell home-search-field relative w-full text-left transition-colors hover:bg-[#faf6ef]",
              activeField === "guests" && "z-[1] bg-[#f7f0e6] ring-1 ring-inset ring-gold/55"
            )
      )}
    >
      {isSearch ? (
        <>
          <span className="listings-search-segment__label">{t("who")}</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onActiveFieldChange("guests");
              onDatePickerOpenChange(false);
              onGuestPickerOpenChange(true);
            }}
            className={cn(
              searchFieldButtonClass,
              guestLabel === guestSearchLabels.empty && "text-charcoal/45"
            )}
          >
            {guestLabel}
          </button>
        </>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onActiveFieldChange("guests");
            onDatePickerOpenChange(false);
            onGuestPickerOpenChange(true);
          }}
          className="flex h-full w-full items-center gap-3 text-left"
        >
          <Users
            className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
            strokeWidth={1.75}
          />
          <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="home-search-field-label">{t("who")}</span>
            <span
              className={cn(
                "text-sm leading-snug text-charcoal",
                guestLabel === guestSearchLabels.empty && "text-muted/55"
              )}
            >
              {guestLabel}
            </span>
          </div>
        </button>
      )}
    </div>
  );

  return (
    <>
      {hiddenInputs}
      {isSearch ? (
        <div className="flex min-w-0 flex-1 items-stretch">
          {checkInSegment}
          {checkOutSegment}
          {guestsSegment}
        </div>
      ) : (
        <>
          {checkInSegment}
          {checkOutSegment}
          {guestsSegment}
        </>
      )}
      {!isSearch && partialDateHint ? (
        <p className="col-span-full px-3 py-1 text-xs text-muted">{partialDateHint}</p>
      ) : null}
      {datePicker}
      {guestPicker}
    </>
  );
}

function MonthlyGuidedFields({
  variant,
  state,
  onStateChange,
  guidedFlow,
  defaults,
}: Omit<Props, "rentalType"> & { rentalType: "monthly" }) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const isSearch = variant === "search";
  const startMonthId = useId();
  const durationId = useId();
  const guestsAnchorRef = useRef<HTMLDivElement>(null);
  const minMonth = minSearchMonthValue();
  const { activeField, onActiveFieldChange, guestPickerOpen, onGuestPickerOpenChange } =
    guidedFlow;

  const safeMonth =
    state.startMonth && !isPastMonthInAthens(state.startMonth) ? state.startMonth : "";

  const guestSearchLabels = useGuestSearchLabels();
  const guestLabel = formatGuestSearchLabel(
    state.guestCounts,
    state.hasGuestSelection,
    guestSearchLabels
  );

  function applyGuests(next: GuestCounts) {
    const hasSelection =
      next.adults + next.children > 0 || next.infants > 0 || next.pets > 0;
    onStateChange({
      guestCounts: next,
      hasGuestSelection: hasSelection,
    });
    onGuestPickerOpenChange(false);
    onActiveFieldChange(null);
  }

  const monthField = isSearch ? (
    <div
      className={cn(
        "listings-search-segment listings-search-segment--grow min-w-0 flex-1 sm:min-w-[8.5rem]",
        "listings-search-segment--divided"
      )}
    >
      <span className="listings-search-segment__label">{t("start")}</span>
      <MonthInput
        name="startMonth"
        value={safeMonth}
        min={minMonth}
        onChange={(e) => onStateChange({ startMonth: e.target.value })}
        className={searchFieldButtonClass}
      />
    </div>
  ) : (
    <HeroSearchField icon={Calendar} label={t("start")} fieldId={startMonthId} openPicker>
      <MonthInput
        id={startMonthId}
        name="startMonth"
        value={safeMonth}
        min={minMonth}
        onChange={(e) => onStateChange({ startMonth: e.target.value })}
        className={heroInputClass}
      />
    </HeroSearchField>
  );

  const durationField = isSearch ? (
    <div
      className={cn(
        "listings-search-segment min-w-0 flex-1 sm:min-w-[8rem]",
        "listings-search-segment--divided"
      )}
    >
      <span className="listings-search-segment__label">{t("duration")}</span>
      <select
        name="durationMonths"
        value={state.durationMonths || defaults?.durationMonths || ""}
        onChange={(e) => onStateChange({ durationMonths: e.target.value })}
        className={cn(heroInputClass, "cursor-pointer text-[15px]")}
      >
        <option value="">{t("anyDuration")}</option>
        {MID_TERM_DURATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {midTermDurationLabel(o.value, locale)}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <HeroSearchField icon={Clock} label={t("duration")} fieldId={durationId} openPicker>
      <select
        id={durationId}
        name="durationMonths"
        value={state.durationMonths}
        onChange={(e) => onStateChange({ durationMonths: e.target.value })}
        className={cn(heroInputClass, "cursor-pointer")}
      >
        <option value="">{t("anyDuration")}</option>
        {MID_TERM_DURATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {midTermDurationLabel(o.value, locale)}
          </option>
        ))}
      </select>
    </HeroSearchField>
  );

  const guestsField = isSearch ? (
    <div
      ref={guestsAnchorRef}
      className={cn(
        "listings-search-segment min-w-0 shrink-0 sm:min-w-[6.5rem] sm:max-w-[9rem]",
        "listings-search-segment--divided",
        activeField === "guests" && "listings-search-segment--active"
      )}
    >
      <span className="listings-search-segment__label">{t("guests")}</span>
      <button
        type="button"
        onClick={() => {
          onActiveFieldChange("guests");
          onGuestPickerOpenChange(true);
        }}
        className={cn(
          searchFieldButtonClass,
          guestLabel === guestSearchLabels.empty && "text-charcoal/45"
        )}
      >
        {guestLabel}
      </button>
    </div>
  ) : (
    <SearchInteractiveTile
      active={activeField === "guests"}
      onClick={() => {
        onActiveFieldChange("guests");
        onGuestPickerOpenChange(true);
      }}
    >
      <Users
        className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
        strokeWidth={1.75}
      />
      <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="home-search-field-label">{t("guests")}</span>
        <span
          className={cn(
            heroInputClass,
            guestLabel === guestSearchLabels.empty && "text-muted/55"
          )}
        >
          {guestLabel}
        </span>
      </div>
    </SearchInteractiveTile>
  );

  return (
    <>
      <input
        type="hidden"
        name="guests"
        value={
          state.hasGuestSelection
            ? String(guestCountsToSearchTotal(state.guestCounts))
            : ""
        }
      />
      <input
        type="hidden"
        name="pets"
        value={petsCountToParam(state.guestCounts, state.hasGuestSelection)}
      />
      {isSearch ? (
        <div className="flex min-w-0 flex-1 items-stretch">
          {monthField}
          {durationField}
          {guestsField}
        </div>
      ) : (
        <>
          {monthField}
          {durationField}
          {guestsField}
        </>
      )}
      <GuestPicker
        open={guestPickerOpen}
        onOpenChange={(open) => {
          onGuestPickerOpenChange(open);
          if (!open) onActiveFieldChange(null);
        }}
        value={state.guestCounts}
        onApply={applyGuests}
        showInfants
        presentation="popover"
        anchorRef={guestsAnchorRef}
        onClear={() =>
          onStateChange({
            guestCounts: { ...EMPTY_GUEST_COUNTS },
            hasGuestSelection: false,
          })
        }
      />
    </>
  );
}

export function GuidedSearchFields(props: Props) {
  if (props.rentalType === "short_term") {
    return <ShortTermGuidedFields {...props} rentalType="short_term" />;
  }
  if (props.rentalType === "monthly") {
    return <MonthlyGuidedFields {...props} rentalType="monthly" />;
  }
  return null;
}

export function guidedStateFromDefaults(defaults?: Props["defaults"]): GuidedSearchState {
  const from = defaults?.interestFrom?.trim();
  const to = defaults?.interestTo?.trim();
  const { counts, hasSelection } = parseGuestSearchParam(
    defaults?.guests,
    defaults?.pets
  );

  return {
    dateRange: from && to && from !== to ? { start: from, end: to } : null,
    guestCounts: counts,
    hasGuestSelection: hasSelection,
    startMonth: defaults?.startMonth?.trim() ?? "",
    durationMonths: defaults?.durationMonths?.trim() ?? "",
  };
}
