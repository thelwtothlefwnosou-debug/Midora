"use client";

import { useId, useState } from "react";
import { Calendar, Clock, Users } from "lucide-react";
import {
  InterestDateRangePicker,
  type DateRangeValue,
} from "@/components/availability/InterestDateRangePicker";
import {
  GuestPicker,
  formatGuestTileLabel,
  guestCountsToSearchTotal,
  type GuestCounts,
} from "@/components/search/GuestPicker";
import { SearchInteractiveTile, HeroSearchField } from "@/components/search/SearchInteractiveTile";
import { MID_TERM_DURATION_OPTIONS } from "@/lib/search-interest-dates";
import {
  type ActiveSearchField,
  SEARCH_DATE_ANYTIME_LABEL,
  SEARCH_GUESTS_LABEL,
  formatSearchDateLabel,
  isCompleteDateRange,
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
  guestCounts: { adults: 2, children: 0, infants: 0 },
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
  };
};

function ShortTermGuidedFields({
  variant,
  state,
  onStateChange,
  guidedFlow,
  partialDateHint,
}: Omit<Props, "rentalType" | "defaults"> & { rentalType: "short_term" }) {
  const isSearch = variant === "search";
  const {
    activeField,
    onActiveFieldChange,
    datePickerOpen,
    onDatePickerOpenChange,
    guestPickerOpen,
    onGuestPickerOpenChange,
  } = guidedFlow;

  const dateLabel = formatSearchDateLabel(state.dateRange);
  const guestLabel = state.hasGuestSelection
    ? formatGuestTileLabel(state.guestCounts)
    : SEARCH_GUESTS_LABEL;

  function applyDateRange(next: DateRangeValue) {
    onStateChange({ dateRange: next });
    if (isCompleteDateRange(next)) {
      onDatePickerOpenChange(false);
      onActiveFieldChange("guests");
      onGuestPickerOpenChange(true);
    }
  }

  function applyGuests(next: GuestCounts) {
    onStateChange({ guestCounts: next, hasGuestSelection: true });
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
    </>
  );

  const datePicker = (
    <InterestDateRangePicker
      open={datePickerOpen}
      onOpenChange={(open) => {
        onDatePickerOpenChange(open);
        if (!open) onActiveFieldChange(null);
      }}
      value={state.dateRange}
      onApply={applyDateRange}
      focusField="start"
      showLegend={false}
      showPrices={false}
      autoApplyOnComplete
      closeOnAutoApply
      title="Πότε;"
      subtitle="Οποιαδήποτε στιγμή ή επίλεξε περίοδο διαμονής"
      applyLabel="Εφαρμογή"
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
      showInfants={false}
    />
  );

  if (isSearch) {
    return (
      <>
        {hiddenInputs}
        <div className="flex min-w-0 flex-1 items-stretch">
          <div
            className={cn(
              "listings-search-segment listings-search-segment--grow min-w-0 flex-1 sm:min-w-[9.5rem]",
              "listings-search-segment--divided",
              activeField === "dates" && "listings-search-segment--active"
            )}
          >
            <span className="listings-search-segment__label">Πότε;</span>
            <button
              type="button"
              onClick={() => {
                onActiveFieldChange("dates");
                onDatePickerOpenChange(true);
              }}
              className={cn(
                "flex min-h-[22px] w-full items-center border-0 bg-transparent p-0 text-left text-[15px] leading-snug text-charcoal outline-none",
                dateLabel === SEARCH_DATE_ANYTIME_LABEL && "text-charcoal/45"
              )}
            >
              {dateLabel}
            </button>
            {partialDateHint ? (
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{partialDateHint}</p>
            ) : null}
          </div>

          <div
            className={cn(
              "listings-search-segment min-w-0 shrink-0 sm:min-w-[6.5rem] sm:max-w-[8.5rem]",
              "listings-search-segment--divided",
              activeField === "guests" && "listings-search-segment--active"
            )}
          >
            <span className="listings-search-segment__label">{SEARCH_GUESTS_LABEL}</span>
            <button
              type="button"
              onClick={() => {
                onActiveFieldChange("guests");
                onGuestPickerOpenChange(true);
              }}
              className={cn(
                "flex min-h-[22px] w-full items-center border-0 bg-transparent p-0 text-left text-[15px] leading-snug text-charcoal outline-none",
                !state.hasGuestSelection && "text-charcoal/45"
              )}
            >
              {guestLabel}
            </button>
          </div>
        </div>
        {datePicker}
        {guestPicker}
      </>
    );
  }

  return (
    <>
      {hiddenInputs}

      <SearchInteractiveTile
        active={activeField === "dates"}
        onClick={() => {
          onActiveFieldChange("dates");
          onDatePickerOpenChange(true);
        }}
      >
        <Calendar
          className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
          strokeWidth={1.75}
        />
        <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center gap-1">
          <span className="home-search-field-label">Πότε;</span>
          <span
            className={cn(
              "w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none",
              dateLabel === SEARCH_DATE_ANYTIME_LABEL && "text-muted/55"
            )}
          >
            {dateLabel}
          </span>
        </div>
      </SearchInteractiveTile>

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
          <span className="home-search-field-label">{SEARCH_GUESTS_LABEL}</span>
          <span
            className={cn(
              "w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none",
              !state.hasGuestSelection && "text-muted/55"
            )}
          >
            {guestLabel}
          </span>
        </div>
      </SearchInteractiveTile>

      {partialDateHint ? (
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
  const isSearch = variant === "search";
  const startMonthId = useId();
  const durationId = useId();
  const minMonth = minSearchMonthValue();
  const { activeField, onActiveFieldChange, guestPickerOpen, onGuestPickerOpenChange } =
    guidedFlow;

  const safeMonth =
    state.startMonth && !isPastMonthInAthens(state.startMonth) ? state.startMonth : "";

  const guestLabel = state.hasGuestSelection
    ? formatGuestTileLabel(state.guestCounts)
    : SEARCH_GUESTS_LABEL;

  function applyGuests(next: GuestCounts) {
    onStateChange({ guestCounts: next, hasGuestSelection: true });
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
      <span className="listings-search-segment__label">Μήνας έναρξης</span>
      <input
        type="month"
        name="startMonth"
        value={safeMonth}
        min={minMonth}
        onChange={(e) => onStateChange({ startMonth: e.target.value })}
        className="flex min-h-[22px] w-full items-center border-0 bg-transparent p-0 text-left text-[15px] leading-snug text-charcoal outline-none"
      />
    </div>
  ) : (
    <HeroSearchField icon={Calendar} label="Μήνας έναρξης" fieldId={startMonthId} openPicker>
      <input
        id={startMonthId}
        type="month"
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
      <span className="listings-search-segment__label">Διάρκεια</span>
      <select
        name="durationMonths"
        value={state.durationMonths || defaults?.durationMonths || ""}
        onChange={(e) => onStateChange({ durationMonths: e.target.value })}
        className={cn(heroInputClass, "cursor-pointer text-[15px]")}
      >
        <option value="">Οποιαδήποτε</option>
        {MID_TERM_DURATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <HeroSearchField icon={Clock} label="Διάρκεια" fieldId={durationId} openPicker>
      <select
        id={durationId}
        name="durationMonths"
        value={state.durationMonths}
        onChange={(e) => onStateChange({ durationMonths: e.target.value })}
        className={cn(heroInputClass, "cursor-pointer")}
      >
        <option value="">Οποιαδήποτε</option>
        {MID_TERM_DURATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </HeroSearchField>
  );

  const guestsField = isSearch ? (
    <div
      className={cn(
        "listings-search-segment min-w-0 shrink-0 sm:min-w-[6.5rem] sm:max-w-[8.5rem]",
        "listings-search-segment--divided",
        activeField === "guests" && "listings-search-segment--active"
      )}
    >
      <span className="listings-search-segment__label">{SEARCH_GUESTS_LABEL}</span>
      <button
        type="button"
        onClick={() => {
          onActiveFieldChange("guests");
          onGuestPickerOpenChange(true);
        }}
        className={cn(
          "flex min-h-[22px] w-full items-center border-0 bg-transparent p-0 text-left text-[15px] leading-snug text-charcoal outline-none",
          !state.hasGuestSelection && "text-charcoal/45"
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
        <span className="home-search-field-label">{SEARCH_GUESTS_LABEL}</span>
        <span
          className={cn(
            heroInputClass,
            !state.hasGuestSelection && "text-muted/55"
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
      {monthField}
      {durationField}
      {guestsField}
      <GuestPicker
        open={guestPickerOpen}
        onOpenChange={(open) => {
          onGuestPickerOpenChange(open);
          if (!open) onActiveFieldChange(null);
        }}
        value={state.guestCounts}
        onApply={applyGuests}
        showInfants={false}
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
  const guestsRaw = defaults?.guests?.trim();
  const guestsNum = guestsRaw ? parseInt(guestsRaw, 10) : 0;

  return {
    dateRange: from && to && from !== to ? { start: from, end: to } : null,
    guestCounts: guestsNum > 0
      ? { adults: guestsNum, children: 0, infants: 0 }
      : { adults: 2, children: 0, infants: 0 },
    hasGuestSelection: guestsNum > 0,
    startMonth: defaults?.startMonth?.trim() ?? "",
    durationMonths: defaults?.durationMonths?.trim() ?? "",
  };
}
