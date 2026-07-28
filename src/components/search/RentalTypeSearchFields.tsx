"use client";

import { useId, useState } from "react";
import { Calendar, CalendarRange, Clock, Home, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { RentalType } from "@/lib/rental-types";
import { MID_TERM_DURATION_OPTIONS, midTermDurationLabel } from "@/lib/search-interest-dates";
import { PROPERTY_TYPES } from "@/lib/types";
import { compareDateKeys } from "@/lib/dates-athens";
import { minSearchMonthValue } from "@/lib/search-date-validation";
import {
  isPastDateInAthens,
  isPastMonthInAthens,
} from "@/lib/dates-athens";
import {
  InterestDateRangePicker,
  type DateRangeFocusField,
  type DateRangeValue,
} from "@/components/availability/InterestDateRangePicker";
import { formatDateKeyDisplay } from "@/lib/availability-calendar";
import { SearchInteractiveTile, HeroSearchField } from "@/components/search/SearchInteractiveTile";
import { MonthInput } from "@/components/ui/MonthInput";
import { cn } from "@/lib/utils";

const tileValueClass =
  "pointer-events-none w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none";

const heroInputClass =
  "w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none";

export function SearchField({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("home-search-field home-hero-search-cell", className)}>
      <Icon className="h-[18px] w-[18px] shrink-0 text-gold/85" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="home-search-field-label">{label}</span>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  rentalType: RentalType | "";
  variant?: "hero" | "compact" | "search";
  showPropertyType?: boolean;
  defaults?: {
    interestFrom?: string;
    interestTo?: string;
    startMonth?: string;
    durationMonths?: string;
    guests?: string;
    propertyType?: string;
  };
  /** Controlled values for the /listings search bar (keeps URL + results in sync). */
  searchValues?: {
    interestFrom?: string;
    interestTo?: string;
    startMonth?: string;
    durationMonths?: string;
    guests?: string;
  };
  onSearchFieldChange?: (
    patch: Partial<NonNullable<Props["searchValues"]>>,
    options?: { autoSearch?: boolean }
  ) => void;
};

function SearchInlineField({
  label,
  children,
  className,
  segmented = false,
  showDivider = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  segmented?: boolean;
  showDivider?: boolean;
}) {
  const labelEl = (
    <span className="listings-search-segment__label">{label}</span>
  );

  if (segmented) {
    return (
      <div
        className={cn(
          "listings-search-segment listings-search-segment--grow min-w-0",
          showDivider && "listings-search-segment--divided",
          className
        )}
      >
        {labelEl}
        <div className="min-w-0">{children}</div>
      </div>
    );
  }

  return (
    <label className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}>
      {labelEl}
      {children}
    </label>
  );
}

const searchFieldClass =
  "flex min-h-[22px] w-full items-center border-0 bg-transparent p-0 text-left text-[15px] leading-snug text-charcoal outline-none transition-colors";

function HeroTileContent({
  icon: Icon,
  label,
  value,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
  placeholder: string;
}) {
  return (
    <>
      <Icon
        className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
        strokeWidth={1.75}
      />
      <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="home-search-field-label">{label}</span>
        <span className={cn(tileValueClass, !value && "text-muted/55")}>
          {value || placeholder}
        </span>
      </div>
    </>
  );
}

function ShortTermDateFields({
  variant,
  defaults,
  searchValues,
  onSearchFieldChange,
}: {
  variant: "hero" | "compact" | "search";
  defaults?: Props["defaults"];
  searchValues?: Props["searchValues"];
  onSearchFieldChange?: Props["onSearchFieldChange"];
}) {
  const t = useTranslations("Search");
  const tPropertyTypes = useTranslations("PropertyTypes");
  const isSearch = variant === "search";
  const compact = variant === "compact" || isSearch;
  const fieldClass = isSearch
    ? cn(searchFieldClass, "text-left")
    : compact
      ? "min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
      : tileValueClass;

  const safeFrom =
    (searchValues?.interestFrom ?? defaults?.interestFrom) &&
    !isPastDateInAthens(searchValues?.interestFrom ?? defaults?.interestFrom ?? "")
      ? (searchValues?.interestFrom ?? defaults?.interestFrom)
      : "";
  const safeTo =
    (searchValues?.interestTo ?? defaults?.interestTo) &&
    !isPastDateInAthens(searchValues?.interestTo ?? defaults?.interestTo ?? "")
      ? (searchValues?.interestTo ?? defaults?.interestTo)
      : "";

  const initial: DateRangeValue =
    safeFrom && safeTo ? { start: safeFrom, end: safeTo } : null;

  const [range, setRange] = useState<DateRangeValue>(initial);
  const controlledRange: DateRangeValue =
    searchValues?.interestFrom && searchValues?.interestTo
      ? { start: searchValues.interestFrom, end: searchValues.interestTo }
      : searchValues?.interestFrom || searchValues?.interestTo
        ? {
            start: searchValues.interestFrom ?? "",
            end: searchValues.interestTo ?? "",
          }
        : null;
  const activeRange = onSearchFieldChange ? controlledRange : range;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFocus, setPickerFocus] = useState<DateRangeFocusField>("start");
  const [activeTile, setActiveTile] = useState<"from" | "to" | null>(null);
  const guestsId = useId();
  const propertyTypeId = useId();

  function openPicker(focus: DateRangeFocusField) {
    setPickerFocus(focus);
    setActiveTile(focus === "start" ? "from" : "to");
    setPickerOpen(true);
  }

  function formatField(dateKey: string | undefined) {
    if (!dateKey) return undefined;
    return formatDateKeyDisplay(dateKey);
  }

  function applyRange(next: DateRangeValue) {
    if (onSearchFieldChange) {
      onSearchFieldChange(
        {
          interestFrom: next?.start ?? "",
          interestTo: next?.end ?? "",
        },
        { autoSearch: Boolean(next?.start && next?.end) }
      );
      return;
    }
    setRange(next);
  }

  if (isSearch) {
    return (
      <>
        <input type="hidden" name="interestFrom" value={activeRange?.start ?? ""} />
        <input type="hidden" name="interestTo" value={activeRange?.end ?? ""} />
        <SearchInlineField
          label={t("dates")}
          segmented
          showDivider
          className="min-w-0 flex-1 sm:min-w-[9.5rem]"
        >
          <button
            type="button"
            onClick={() => openPicker("start")}
            className={cn(
              fieldClass,
              !activeRange?.start && "text-charcoal/45"
            )}
          >
            {activeRange?.start && activeRange?.end
              ? `${formatField(activeRange.start)} – ${formatField(activeRange.end)}`
              : t("selectDates")}
          </button>
        </SearchInlineField>
        <InterestDateRangePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={activeRange}
          onApply={applyRange}
          focusField={pickerFocus}
          showLegend={false}
          autoApplyOnComplete
          closeOnAutoApply
        />
      </>
    );
  }

  if (variant === "hero") {
    return (
      <>
        <input type="hidden" name="interestFrom" value={range?.start ?? ""} />
        <input type="hidden" name="interestTo" value={range?.end ?? ""} />

        <SearchInteractiveTile
          active={activeTile === "from"}
          onClick={() => openPicker("start")}
        >
          <HeroTileContent
            icon={Calendar}
            label={t("from")}
            value={formatField(range?.start)}
            placeholder={t("add")}
          />
        </SearchInteractiveTile>

        <SearchInteractiveTile
          active={activeTile === "to"}
          onClick={() => openPicker("end")}
        >
          <HeroTileContent
            icon={CalendarRange}
            label={t("to")}
            value={formatField(range?.end)}
            placeholder={t("add")}
          />
        </SearchInteractiveTile>

        <HeroSearchField icon={Users} label={t("guests")} fieldId={guestsId}>
          <input
            id={guestsId}
            type="number"
            name="guests"
            min={1}
            placeholder={t("guestsPlaceholder")}
            defaultValue={defaults?.guests}
            className={heroInputClass}
          />
        </HeroSearchField>

        <HeroSearchField
          icon={Home}
          label={t("propertyType")}
          fieldId={propertyTypeId}
          openPicker
        >
          <select
            id={propertyTypeId}
            name="propertyType"
            defaultValue={defaults?.propertyType ?? ""}
            className={cn(heroInputClass, "cursor-pointer")}
          >
            <option value="">{t("allTypes")}</option>
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {tPropertyTypes(pt.value)}
              </option>
            ))}
          </select>
        </HeroSearchField>

        <InterestDateRangePicker
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) setActiveTile(null);
          }}
          value={range}
          onApply={setRange}
          focusField={pickerFocus}
          showLegend={false}
        />
      </>
    );
  }

  return (
    <>
      <input type="hidden" name="interestFrom" value={range?.start ?? ""} />
      <input type="hidden" name="interestTo" value={range?.end ?? ""} />
      <SearchField icon={Calendar} label={t("from")}>
        <button
          type="button"
          onClick={() => openPicker("start")}
          className={cn(fieldClass, "text-left", !range?.start && "text-muted/55")}
        >
          {formatField(range?.start) ?? t("add")}
        </button>
      </SearchField>
      <SearchField icon={CalendarRange} label={t("to")}>
        <button
          type="button"
          onClick={() => openPicker("end")}
          className={cn(fieldClass, "text-left", !range?.end && "text-muted/55")}
        >
          {formatField(range?.end) ?? t("add")}
        </button>
      </SearchField>
      <InterestDateRangePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={range}
        onApply={setRange}
        focusField={pickerFocus}
        showLegend={false}
      />
    </>
  );
}

function MonthlyDateFields({
  variant,
  defaults,
  searchValues,
  onSearchFieldChange,
}: {
  variant: "hero" | "compact" | "search";
  defaults?: Props["defaults"];
  searchValues?: Props["searchValues"];
  onSearchFieldChange?: Props["onSearchFieldChange"];
}) {
  const t = useTranslations("Search");
  const isSearch = variant === "search";
  const compact = variant === "compact" || isSearch;
  const startMonthId = useId();
  const fieldClass = isSearch
    ? searchFieldClass
    : compact
      ? "min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
      : "w-full min-w-0 bg-transparent text-sm text-charcoal outline-none";
  const minMonth = minSearchMonthValue();

  const safeMonth =
    (searchValues?.startMonth ?? defaults?.startMonth) &&
    !isPastMonthInAthens(searchValues?.startMonth ?? defaults?.startMonth ?? "")
      ? (searchValues?.startMonth ?? defaults?.startMonth)
      : "";

  if (isSearch) {
    return (
      <SearchInlineField
        label={t("startMonth")}
        segmented
        showDivider
        className="min-w-0 flex-1 sm:min-w-[8.5rem]"
      >
        <MonthInput
          name="startMonth"
          value={safeMonth ?? ""}
          min={minMonth}
          onChange={(e) =>
            onSearchFieldChange?.({ startMonth: e.target.value }, { autoSearch: true })
          }
          className={fieldClass}
        />
      </SearchInlineField>
    );
  }

  return (
    <HeroSearchField
      icon={Calendar}
      label={t("startMonth")}
      fieldId={startMonthId}
      openPicker
    >
      <MonthInput
        id={startMonthId}
        name="startMonth"
        defaultValue={safeMonth}
        min={minMonth}
        className={fieldClass}
      />
    </HeroSearchField>
  );
}

export function RentalTypeSearchFields({
  rentalType,
  variant = "hero",
  showPropertyType = false,
  defaults,
  searchValues,
  onSearchFieldChange,
}: Props) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const isSearch = variant === "search";
  const compact = variant === "compact";
  const guestsId = useId();
  const durationId = useId();
  const fieldClass = isSearch
    ? searchFieldClass
    : compact
      ? "min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
      : "w-full min-w-0 bg-transparent text-sm text-charcoal outline-none";

  const guestsField = isSearch ? (
    <SearchInlineField
      label={rentalType === "monthly" ? t("guests") : t("visitors")}
      segmented
      showDivider
      className="min-w-0 shrink-0 sm:min-w-[6.5rem] sm:max-w-[8.5rem]"
    >
      <div className="flex min-w-0 items-baseline gap-1">
        <input
          type="number"
          name="guests"
          min={1}
          placeholder="2"
          value={searchValues?.guests ?? defaults?.guests ?? ""}
          onChange={(e) => onSearchFieldChange?.({ guests: e.target.value })}
          onBlur={(e) =>
            onSearchFieldChange?.({ guests: e.target.value }, { autoSearch: true })
          }
          className={cn(fieldClass, "max-w-[3rem] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none")}
        />
        {(searchValues?.guests ?? defaults?.guests) && (
          <span className="listings-search-segment__value text-charcoal/70">
            {t("peopleUnit")}
          </span>
        )}
      </div>
    </SearchInlineField>
  ) : (
    <HeroSearchField
      icon={Users}
      label={rentalType === "monthly" ? t("guests") : t("visitors")}
      fieldId={guestsId}
    >
      <input
        id={guestsId}
        type="number"
        name="guests"
        min={1}
        placeholder={t("guestsPlaceholder")}
        defaultValue={defaults?.guests}
        className={heroInputClass}
      />
    </HeroSearchField>
  );

  const durationField = isSearch ? (
    <SearchInlineField
      label={t("duration")}
      segmented
      showDivider
      className="min-w-0 flex-1 sm:min-w-[8rem]"
    >
      <select
        name="durationMonths"
        value={searchValues?.durationMonths ?? defaults?.durationMonths ?? "2"}
        onChange={(e) =>
          onSearchFieldChange?.({ durationMonths: e.target.value }, { autoSearch: true })
        }
        className={cn(fieldClass, "cursor-pointer")}
      >
        {MID_TERM_DURATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {midTermDurationLabel(o.value, locale)}
          </option>
        ))}
      </select>
    </SearchInlineField>
  ) : (
    <HeroSearchField icon={Clock} label={t("duration")} fieldId={durationId} openPicker>
      <select
        id={durationId}
        name="durationMonths"
        defaultValue={defaults?.durationMonths ?? "2"}
        className={cn(fieldClass, "cursor-pointer")}
      >
        {MID_TERM_DURATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {midTermDurationLabel(o.value, locale)}
          </option>
        ))}
      </select>
    </HeroSearchField>
  );

  if (rentalType === "short_term") {
    if (isSearch) {
      return (
        <div className="flex min-w-0 flex-1 items-stretch">
          <ShortTermDateFields
            variant={variant}
            defaults={defaults}
            searchValues={searchValues}
            onSearchFieldChange={onSearchFieldChange}
          />
          {guestsField}
        </div>
      );
    }
    return <ShortTermDateFields variant={variant} defaults={defaults} />;
  }

  if (rentalType === "monthly") {
    const monthlyFields = (
      <>
        <MonthlyDateFields
          variant={variant}
          defaults={defaults}
          searchValues={searchValues}
          onSearchFieldChange={onSearchFieldChange}
        />
        {durationField}
        {guestsField}
        {showPropertyType && (
          <PropertyTypeField
            variant={variant === "search" ? "compact" : variant}
            defaultValue={defaults?.propertyType}
          />
        )}
      </>
    );

    if (isSearch) {
      return (
        <div className="flex min-w-0 flex-1 items-stretch">
          {monthlyFields}
        </div>
      );
    }

    return monthlyFields;
  }

  return null;
}

function PropertyTypeField({
  variant,
  defaultValue,
}: {
  variant: "hero" | "compact";
  defaultValue?: string;
}) {
  const t = useTranslations("Search");
  const tPropertyTypes = useTranslations("PropertyTypes");
  const compact = variant === "compact";
  const propertyTypeId = useId();
  const fieldClass = compact
    ? "min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
    : heroInputClass;

  if (compact) {
    return (
      <SearchField icon={Home} label={t("propertyType")}>
        <select
          name="propertyType"
          defaultValue={defaultValue ?? ""}
          className={cn(fieldClass, "cursor-pointer")}
        >
          <option value="">{t("allTypes")}</option>
          {PROPERTY_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {tPropertyTypes(pt.value)}
            </option>
          ))}
        </select>
      </SearchField>
    );
  }

  return (
    <HeroSearchField
      icon={Home}
      label={t("propertyType")}
      fieldId={propertyTypeId}
      openPicker
    >
      <select
        id={propertyTypeId}
        name="propertyType"
        defaultValue={defaultValue ?? ""}
        className={cn(fieldClass, "cursor-pointer")}
      >
        <option value="">{t("allTypes")}</option>
        {PROPERTY_TYPES.map((pt) => (
          <option key={pt.value} value={pt.value}>
            {tPropertyTypes(pt.value)}
          </option>
        ))}
      </select>
    </HeroSearchField>
  );
}

export function appendRentalSearchParams(
  params: URLSearchParams,
  data: FormData,
  rentalType: string
) {
  const guests = (data.get("guests") as string)?.trim();
  if (guests) params.set("guests", guests);

  const pets = (data.get("pets") as string)?.trim();
  if (pets && pets !== "0") params.set("pets", pets);

  const propertyType = (data.get("propertyType") as string)?.trim();
  if (propertyType) params.set("type", propertyType);

  if (rentalType === "short_term") {
    let from = (data.get("interestFrom") as string)?.trim();
    let to = (data.get("interestTo") as string)?.trim();
    if (from && isPastDateInAthens(from)) from = "";
    if (to && isPastDateInAthens(to)) to = "";
    if (from && to && compareDateKeys(to, from) < 0) to = from;
    if (from) {
      params.set("interestFrom", from);
      params.set("start", from);
    }
    if (to) {
      params.set("interestTo", to);
      params.set("end", to);
    }
  } else if (rentalType === "monthly") {
    const startMonth = (data.get("startMonth") as string)?.trim();
    const durationMonths = (data.get("durationMonths") as string)?.trim();
    if (startMonth && !isPastMonthInAthens(startMonth)) {
      params.set("startMonth", startMonth);
    }
    if (durationMonths) {
      const duration = parseInt(durationMonths, 10);
      if (Number.isFinite(duration) && duration >= 2) {
        params.set("durationMonths", String(duration));
      }
    }
  }
}
