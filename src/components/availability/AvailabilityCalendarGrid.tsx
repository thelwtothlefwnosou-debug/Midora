"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDateKeyDisplay,
  formatMonthYear,
  getCalendarDays,
  getSelectionRole,
  isBeforeMinimumStayEnd,
  isDateUnavailable,
  isPastDate,
  isToday,
  WEEKDAY_LABELS,
  type CalendarDay,
} from "@/lib/availability-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn } from "@/lib/utils";

export type CalendarMode = "owner" | "interest" | "display";

export type UnavailableDayStyle = "default" | "premium-blocked";

type Props = {
  month: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
  mode: CalendarMode;
  selectionStart?: string | null;
  selectionEnd?: string | null;
  onDateClick?: (dateKey: string) => void;
  onDateHover?: (dateKey: string | null) => void;
  minimumStayNights?: number;
  priceForDate?: (dateKey: string) => number | null;
  isCustomPrice?: (dateKey: string) => boolean;
  isWeekendDay?: (dateKey: string) => boolean;
  showPrices?: boolean;
  priceCellSize?: "default" | "large";
  className?: string;
  hideHeader?: boolean;
  compact?: boolean;
  showLegend?: boolean;
  layout?: "responsive" | "dual" | "single";
  /** Premium blocked styling for public listing availability calendar only. */
  unavailableDayStyle?: UnavailableDayStyle;
};

function unavailableDayAriaLabel(
  dateKey: string,
  reason: "past" | "blocked" | "min-stay"
): string {
  const formatted = formatDateKeyDisplay(dateKey);
  if (reason === "past") {
    return `${formatted}, παρελθούσα ημερομηνία, μη διαθέσιμη`;
  }
  return `${formatted}, μη διαθέσιμη`;
}

function DayCell({
  day,
  mode,
  periods,
  selectionStart,
  selectionEnd,
  onDateClick,
  onDateHover,
  minimumStayNights,
  priceForDate,
  isCustomPrice,
  isWeekendDay,
  showPrices,
  priceCellSize = "default",
  compact,
  unavailableDayStyle = "default",
}: {
  day: CalendarDay;
  mode: CalendarMode;
  periods: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
  selectionStart?: string | null;
  selectionEnd?: string | null;
  onDateClick?: (dateKey: string) => void;
  onDateHover?: (dateKey: string | null) => void;
  minimumStayNights?: number;
  priceForDate?: (dateKey: string) => number | null;
  isCustomPrice?: (dateKey: string) => boolean;
  isWeekendDay?: (dateKey: string) => boolean;
  showPrices?: boolean;
  priceCellSize?: "default" | "large";
  compact?: boolean;
  unavailableDayStyle?: UnavailableDayStyle;
}) {
  const unavailable = isDateUnavailable(day.dateKey, periods);
  const past = isPastDate(day.dateKey);
  const weekend =
    day.inMonth && !past && isWeekendDay ? isWeekendDay(day.dateKey) : false;
  const selectionRole = day.inMonth
    ? getSelectionRole(day.dateKey, selectionStart, selectionEnd)
    : false;
  const today = isToday(day.dateKey);
  const tooEarlyForMinStay =
    Boolean(selectionStart && !selectionEnd && minimumStayNights && minimumStayNights > 1) &&
    isBeforeMinimumStayEnd(selectionStart!, day.dateKey, minimumStayNights!);
  const usePremiumBlocked = unavailableDayStyle === "premium-blocked";
  const premiumBlocked =
    usePremiumBlocked &&
    day.inMonth &&
    !selectionRole &&
    (past || unavailable || tooEarlyForMinStay);
  const disabled = !day.inMonth || past || mode === "display";
  const interactive =
    (mode === "owner" || mode === "interest") &&
    day.inMonth &&
    !disabled &&
    onDateClick &&
    (usePremiumBlocked
      ? !past && !unavailable && !tooEarlyForMinStay
      : !past);

  const sizeClass =
    priceCellSize === "large"
      ? "min-h-[3.5rem] w-full py-1 text-sm"
      : compact
        ? "h-9 w-9 text-[11px]"
        : "h-11 w-11 text-sm";
  const nightPrice =
    showPrices && day.inMonth && priceForDate ? priceForDate(day.dateKey) : null;
  const customPrice =
    showPrices && day.inMonth && isCustomPrice ? isCustomPrice(day.dateKey) : false;
  const ownerSelected =
    mode === "owner" && (selectionRole === "start" || selectionRole === "end");
  const charcoalSelection = mode === "owner" || mode === "interest";

  const content = (
    <span
      className={cn(
        "calendar-day__number relative z-10 flex flex-col items-center justify-center font-medium transition-all duration-150",
        sizeClass,
        premiumBlocked && "calendar-day__number--blocked",
        !premiumBlocked && !day.inMonth && "text-transparent",
        !premiumBlocked && day.inMonth && past && "text-muted/35",
        !premiumBlocked && day.inMonth && unavailable && !past && !selectionRole && "text-muted",
        !premiumBlocked &&
          day.inMonth &&
          !unavailable &&
          !past &&
          !selectionRole &&
          tooEarlyForMinStay &&
          "text-muted/50",
        !premiumBlocked &&
          day.inMonth &&
          !unavailable &&
          !past &&
          !selectionRole &&
          !tooEarlyForMinStay &&
          "text-charcoal",
        selectionRole === "start" || selectionRole === "end"
          ? ownerSelected || charcoalSelection
            ? "rounded-full bg-charcoal font-semibold text-white shadow-sm"
            : "rounded-full bg-gold font-semibold text-white shadow-sm"
          : selectionRole === "middle"
            ? "rounded-none font-semibold text-charcoal"
            : !premiumBlocked && today && day.inMonth && !selectionRole
              ? "rounded-full font-semibold text-charcoal ring-2 ring-gold/45 ring-offset-1"
              : !premiumBlocked
                ? "rounded-full"
                : undefined
      )}
    >
      {customPrice && !selectionRole && !unavailable && day.inMonth && !past && (
        <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
      )}
      <span>{day.inMonth ? day.date.getDate() : ""}</span>
      {!premiumBlocked &&
      unavailable &&
      day.inMonth &&
      !past &&
      !selectionRole &&
      priceCellSize === "large" ? (
        <span className="mt-0.5 text-[9px] font-normal leading-none text-muted">
          Μη διαθέσιμο
        </span>
      ) : nightPrice != null && day.inMonth && !past && !premiumBlocked ? (
        <span
          className={cn(
            "mt-0.5 font-medium leading-none",
            priceCellSize === "large" ? "text-[11px]" : "text-[9px] font-normal",
            ownerSelected || selectionRole
              ? "text-white/90"
              : unavailable
                ? "text-muted/70"
                : customPrice
                  ? "text-gold-dark"
                  : "text-muted"
          )}
        >
          €{nightPrice.toLocaleString("el-GR")}
        </span>
      ) : null}
    </span>
  );

  const cellClass = cn(
    "relative flex items-center justify-center",
    premiumBlocked && "calendar-day--unavailable cursor-not-allowed",
    priceCellSize === "large" && "min-h-[3.5rem] border-b border-r border-border/40",
    !day.inMonth && "pointer-events-none",
    !premiumBlocked &&
      selectionRole === "middle" &&
      (charcoalSelection
        ? "bg-charcoal/12 before:absolute before:inset-y-1.5 before:left-0 before:right-0 before:-z-0 before:bg-charcoal/12"
        : "bg-gold/18 before:absolute before:inset-y-1.5 before:left-0 before:right-0 before:-z-0 before:bg-gold/18"),
    !premiumBlocked &&
      selectionRole === "start" &&
      (charcoalSelection
        ? "bg-charcoal/12 before:absolute before:inset-y-1.5 before:left-1/2 before:right-0 before:-z-0 before:rounded-l-full before:bg-charcoal/12"
        : "bg-gold/18 before:absolute before:inset-y-1.5 before:left-1/2 before:right-0 before:-z-0 before:rounded-l-full before:bg-gold/18"),
    !premiumBlocked &&
      selectionRole === "end" &&
      (charcoalSelection
        ? "bg-charcoal/12 before:absolute before:inset-y-1.5 before:left-0 before:right-1/2 before:-z-0 before:rounded-r-full before:bg-charcoal/12"
        : "bg-gold/18 before:absolute before:inset-y-1.5 before:left-0 before:right-1/2 before:-z-0 before:rounded-r-full before:bg-gold/18"),
    !premiumBlocked && unavailable && day.inMonth && !past && !selectionRole && "bg-charcoal/8",
    !premiumBlocked &&
      weekend &&
      day.inMonth &&
      !past &&
      !unavailable &&
      !selectionRole &&
      "bg-gold/6",
    !premiumBlocked && tooEarlyForMinStay && day.inMonth && !past && !unavailable && "bg-sand/50",
    !premiumBlocked && past && day.inMonth && "opacity-45",
    interactive && "cursor-pointer hover:bg-gold/8"
  );

  if (!interactive) {
    const blockedReason = premiumBlocked
      ? past
        ? "past"
        : unavailable
          ? "blocked"
          : "min-stay"
      : null;

    return (
      <div
        className={cellClass}
        aria-hidden={!day.inMonth && !premiumBlocked}
        role={premiumBlocked ? "gridcell" : undefined}
        aria-disabled={premiumBlocked ? true : undefined}
        tabIndex={premiumBlocked ? -1 : undefined}
        aria-label={
          premiumBlocked && blockedReason
            ? unavailableDayAriaLabel(day.dateKey, blockedReason)
            : undefined
        }
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onDateClick?.(day.dateKey)}
      onMouseEnter={() => onDateHover?.(day.dateKey)}
      onMouseLeave={() => onDateHover?.(null)}
      className={cellClass}
      aria-label={`${formatDateKeyDisplay(day.dateKey)}${unavailable ? ", μη διαθέσιμο" : ""}${past ? ", παρελθόν" : ""}${tooEarlyForMinStay ? ", πριν την ελάχιστη διαμονή" : ""}`}
    >
      {content}
    </button>
  );
}

function MonthGrid({
  month,
  periods,
  mode,
  selectionStart,
  selectionEnd,
  onDateClick,
  onDateHover,
  minimumStayNights,
  priceForDate,
  isCustomPrice,
  isWeekendDay,
  showPrices,
  priceCellSize,
  compact,
  unavailableDayStyle,
}: Omit<Props, "onPrevMonth" | "onNextMonth" | "className" | "hideHeader">) {
  const days = getCalendarDays(month);
  return (
    <div className={cn("grid grid-cols-7", priceCellSize === "large" && "overflow-hidden rounded-xl border border-border")}>
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted/80"
        >
          {label}
        </div>
      ))}
      {days.map((day) => (
        <DayCell
          key={`${month.toISOString()}-${day.dateKey}`}
          day={day}
          mode={mode}
          periods={periods}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          onDateClick={onDateClick}
          onDateHover={onDateHover}
          minimumStayNights={minimumStayNights}
          priceForDate={priceForDate}
          isCustomPrice={isCustomPrice}
          isWeekendDay={isWeekendDay}
          showPrices={showPrices}
          priceCellSize={priceCellSize}
          compact={compact}
          unavailableDayStyle={unavailableDayStyle}
        />
      ))}
    </div>
  );
}

function CalendarLegend({
  mode,
  unavailableDayStyle = "default",
}: {
  mode: CalendarMode;
  unavailableDayStyle?: UnavailableDayStyle;
}) {
  if (unavailableDayStyle === "premium-blocked") {
    return (
      <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-charcoal" />
            Επιλεγμένες ημερομηνίες
          </span>
          <span className="flex items-center gap-2">
            <span className="calendar-day-legend-sample relative flex h-3.5 w-3.5 items-center justify-center text-[10px]">
              0
            </span>
            Μη διαθέσιμες ημερομηνίες
          </span>
        </div>
        <p>Στις μη διαθέσιμες περιλαμβάνονται και οι ημερομηνίες στο παρελθόν.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full bg-gold" />
        Επιλεγμένες ημερομηνίες
      </span>
      <span className="flex items-center gap-2">
        <span className="relative h-3.5 w-3.5 rounded-sm bg-charcoal/[0.06] after:absolute after:inset-0 after:rotate-45 after:border-t after:border-charcoal/25" />
        Μη διαθέσιμες ημερομηνίες
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full opacity-35 ring-1 ring-border" />
        Μη διαθέσιμες στο παρελθόν
      </span>
      {mode === "owner" && (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border border-border bg-white" />
          Διαθέσιμο
        </span>
      )}
      {mode === "owner" && (
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-teal">€</span>
          Ειδική τιμή
        </span>
      )}
    </div>
  );
}

export function AvailabilityCalendarGrid({
  month,
  onPrevMonth,
  onNextMonth,
  periods,
  mode,
  selectionStart,
  selectionEnd,
  onDateClick,
  onDateHover,
  minimumStayNights,
  priceForDate,
  isCustomPrice,
  isWeekendDay,
  showPrices,
  priceCellSize,
  className,
  hideHeader = false,
  compact = false,
  showLegend = true,
  unavailableDayStyle = "default",
}: Props) {
  return (
    <div className={cn("select-none", className)}>
      {!hideHeader && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-charcoal shadow-sm transition-colors hover:border-gold/40 hover:bg-sand/60"
            aria-label="Προηγούμενος μήνας"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="font-display text-base font-semibold text-charcoal">
            {formatMonthYear(month)}
          </p>
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-charcoal shadow-sm transition-colors hover:border-gold/40 hover:bg-sand/60"
            aria-label="Επόμενος μήνας"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <MonthGrid
        month={month}
        periods={periods}
        mode={mode}
        selectionStart={selectionStart}
        selectionEnd={selectionEnd}
        onDateClick={onDateClick}
        onDateHover={onDateHover}
        minimumStayNights={minimumStayNights}
        priceForDate={priceForDate}
        isCustomPrice={isCustomPrice}
        isWeekendDay={isWeekendDay}
        showPrices={showPrices}
        priceCellSize={priceCellSize}
        compact={compact}
        unavailableDayStyle={unavailableDayStyle}
      />

      {showLegend && (
        <CalendarLegend mode={mode} unavailableDayStyle={unavailableDayStyle} />
      )}
    </div>
  );
}

/** Dual-month panel — premium date picker layout */
export function AvailabilityCalendarPanel({
  month,
  onPrevMonth,
  onNextMonth,
  periods,
  mode,
  selectionStart,
  selectionEnd,
  onDateClick,
  onDateHover,
  minimumStayNights,
  priceForDate,
  isCustomPrice,
  isWeekendDay,
  showPrices,
  priceCellSize,
  className,
  title,
  showLegend = true,
  layout = "responsive",
  hideNav = false,
  compact = false,
  unavailableDayStyle = "default",
}: Omit<Props, "hideHeader"> & { title?: string; hideNav?: boolean }) {
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const showDual = layout === "dual" || (layout === "responsive");
  const showSingleOnly = layout === "single";

  return (
    <div className={cn("select-none", className)}>
      {!hideNav && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevMonth}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-charcoal shadow-sm transition-colors hover:border-gold/40 hover:bg-gold/8"
            aria-label="Προηγούμενος μήνας"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {title ? (
            <p className="text-center text-sm font-medium text-muted">{title}</p>
          ) : (
            <div
              className={cn(
                "min-w-0 flex-1 text-center",
                showDual && !showSingleOnly && "hidden md:block"
              )}
            >
              <p className="font-display text-sm font-semibold text-charcoal">
                {formatMonthYear(month)}
                {showDual && !showSingleOnly && (
                  <>
                    <span className="mx-2 text-muted">—</span>
                    {formatMonthYear(nextMonth)}
                  </>
                )}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-charcoal shadow-sm transition-colors hover:border-gold/40 hover:bg-gold/8"
            aria-label="Επόμενος μήνας"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showDual && !showSingleOnly && (
        <div className="hidden gap-8 md:grid md:grid-cols-2">
          <div>
            <p className="mb-3 text-center font-display text-sm font-semibold text-charcoal">
              {formatMonthYear(month)}
            </p>
            <MonthGrid
              month={month}
              periods={periods}
              mode={mode}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onDateClick={onDateClick}
              onDateHover={onDateHover}
              minimumStayNights={minimumStayNights}
              priceForDate={priceForDate}
              isCustomPrice={isCustomPrice}
              isWeekendDay={isWeekendDay}
              showPrices={showPrices}
              priceCellSize={priceCellSize}
              compact={compact}
              unavailableDayStyle={unavailableDayStyle}
            />
          </div>
          <div>
            <p className="mb-3 text-center font-display text-sm font-semibold text-charcoal">
              {formatMonthYear(nextMonth)}
            </p>
            <MonthGrid
              month={nextMonth}
              periods={periods}
              mode={mode}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onDateClick={onDateClick}
              onDateHover={onDateHover}
              minimumStayNights={minimumStayNights}
              priceForDate={priceForDate}
              isCustomPrice={isCustomPrice}
              isWeekendDay={isWeekendDay}
              showPrices={showPrices}
              priceCellSize={priceCellSize}
              compact={compact}
              unavailableDayStyle={unavailableDayStyle}
            />
          </div>
        </div>
      )}

      <div className={cn(showDual && !showSingleOnly && "md:hidden")}>
        <p className="mb-3 text-center font-display text-sm font-semibold text-charcoal">
          {formatMonthYear(month)}
        </p>
        <MonthGrid
          month={month}
          periods={periods}
          mode={mode}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          onDateClick={onDateClick}
          onDateHover={onDateHover}
          minimumStayNights={minimumStayNights}
          priceForDate={priceForDate}
          isCustomPrice={isCustomPrice}
          isWeekendDay={isWeekendDay}
          showPrices={showPrices}
          priceCellSize={priceCellSize}
          compact={showSingleOnly}
          unavailableDayStyle={unavailableDayStyle}
        />
      </div>

      {showLegend && (
        <CalendarLegend mode={mode} unavailableDayStyle={unavailableDayStyle} />
      )}
    </div>
  );
}
