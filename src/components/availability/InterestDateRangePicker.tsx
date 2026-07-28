"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { useDateRangeSelection } from "@/hooks/useDateRangeSelection";
import {
  addMonths,
  formatDateKeyDisplay,
  isBeforeMinimumStayEnd,
  meetsMinimumStayNights,
  stayNightsBetween,
} from "@/lib/availability-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { SearchFieldPopover } from "@/components/search/SearchFieldPopover";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

export type DateRangeValue = {
  start: string;
  end: string;
} | null;

export type DateRangeFocusField = "start" | "end";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DateRangeValue;
  onApply: (value: DateRangeValue) => void;
  periods?: Pick<ListingUnavailablePeriod, "start_date" | "end_date">[];
  title?: string;
  subtitle?: string;
  mobileTitle?: string;
  showLegend?: boolean;
  applyLabel?: string;
  mobileApplyLabel?: string;
  minimumStayNights?: number;
  listingId?: string;
  focusField?: DateRangeFocusField;
  showPrices?: boolean;
  priceForDate?: (dateKey: string) => number | null;
  isWeekendDay?: (dateKey: string) => boolean;
  /** Apply range as soon as a valid start/end pair is selected. */
  autoApplyOnComplete?: boolean;
  /** Close the picker after auto-apply (requires autoApplyOnComplete). */
  closeOnAutoApply?: boolean;
  presentation?: "modal" | "popover";
  anchorRef?: React.RefObject<HTMLElement | null>;
  ignoreRefs?: React.RefObject<HTMLElement | null>[];
  clearLabel?: string;
  /** Premium blocked styling for public listing calendars. */
  unavailableDayStyle?: "default" | "premium-blocked";
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

export function InterestDateRangePicker({
  open,
  onOpenChange,
  value,
  onApply,
  periods = [],
  title,
  subtitle,
  mobileTitle,
  showLegend = false,
  applyLabel,
  mobileApplyLabel,
  minimumStayNights,
  listingId,
  focusField = "start",
  showPrices = false,
  priceForDate,
  isWeekendDay,
  autoApplyOnComplete = false,
  closeOnAutoApply = false,
  presentation = "modal",
  anchorRef,
  ignoreRefs,
  clearLabel,
  unavailableDayStyle = "default",
}: Props) {
  const t = useTranslations("Listing.datePicker");
  const locale = useLocale();
  const resolvedTitle = title ?? t("title");
  const resolvedSubtitle = subtitle ?? t("subtitle");
  const resolvedMobileTitle = mobileTitle ?? t("mobileTitle");
  const resolvedApplyLabel = applyLabel ?? t("apply");
  const resolvedMobileApplyLabel = mobileApplyLabel ?? t("mobileApply");
  const resolvedClearLabel = clearLabel ?? t("clear");
  const titleId = useId();
  const isMobile = useIsMobile();
  const [month, setMonth] = useState(() => new Date());
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const {
    selectionStart,
    selectionEnd,
    hasCompleteRange,
    isRangeValid,
    clearSelection,
    setRange,
    handleDateClick,
  } = useDateRangeSelection({ periods, listingId, minimumStayNights });

  const syncFromValue = useCallback(
    (next: DateRangeValue) => {
      if (!next) {
        clearSelection();
        return;
      }
      if (next.start === next.end) {
        setRange(next.start, null);
      } else {
        setRange(next.start, next.end);
      }
      const [y, m] = next.start.split("-").map(Number);
      setMonth(new Date(y, m - 1, 1));
    },
    [clearSelection, setRange]
  );

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset picker draft when modal opens
    syncFromValue(value);
    setHoverDate(null);
    if (focusField === "end" && value?.end) {
      const [y, m] = value.end.split("-").map(Number);
      setMonth(new Date(y, m - 1, 1));
    } else if (value?.start) {
      const [y, m] = value.start.split("-").map(Number);
      setMonth(new Date(y, m - 1, 1));
    }
  }, [focusField, open, syncFromValue, value]);

  useEffect(() => {
    if (!open || presentation === "popover") return;
    // Only lock vertical scroll — overflow shorthand would wipe overflow-x:clip
    // from ListingDetailScrollFix and break position:sticky on the inquiry card.
    const prevY = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = prevY;
    };
  }, [open, presentation]);

  const handleRequestClose = useCallback(() => {
    if (presentation === "popover") {
      onOpenChange(false);
      return;
    }

    const dirty =
      selectionStart !== (value?.start ?? null) ||
      selectionEnd !== (value?.end ?? null);

    if (dirty && (selectionStart || selectionEnd)) {
      const discard = window.confirm(t("unsavedClose"));
      if (!discard) return;
    }
    onOpenChange(false);
  }, [onOpenChange, presentation, selectionEnd, selectionStart, t, value?.end, value?.start]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleRequestClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleRequestClose]);

  function handleClear() {
    clearSelection();
    setHoverDate(null);
    if (presentation === "popover") {
      onApply(null);
    }
  }

  function handleApply() {
    if (!canApply || !selectionStart || !selectionEnd) return;
    onApply({ start: selectionStart, end: selectionEnd });
    onOpenChange(false);
  }

  const minStay = minimumStayNights ?? 0;
  const meetsMinStay =
    !minStay ||
    !hasCompleteRange ||
    !selectionStart ||
    !selectionEnd ||
    meetsMinimumStayNights(selectionStart, selectionEnd, minStay);

  const canApply = hasCompleteRange && isRangeValid && meetsMinStay;

  useEffect(() => {
    if (!open || !autoApplyOnComplete) return;
    if (!canApply || !selectionStart || !selectionEnd) return;

    // Keep the picker open when syncing an already-applied range (user wants to edit).
    if (value?.start === selectionStart && value?.end === selectionEnd) return;

    onApply({ start: selectionStart, end: selectionEnd });

    if (closeOnAutoApply) {
      onOpenChange(false);
    }
  }, [
    autoApplyOnComplete,
    canApply,
    closeOnAutoApply,
    onApply,
    onOpenChange,
    open,
    selectionEnd,
    selectionStart,
    value?.end,
    value?.start,
  ]);

  const minStayWarning =
    minStay > 1 &&
    hasCompleteRange &&
    selectionStart &&
    selectionEnd &&
    !meetsMinStay ? (
      <p className="text-sm text-amber-800">
        {t("minStaySelect", { count: minStay })}
      </p>
    ) : null;

  const hoverMinStayHint =
    minStay > 1 &&
    selectionStart &&
    !selectionEnd &&
    hoverDate &&
    isBeforeMinimumStayEnd(selectionStart, hoverDate, minStay) ? (
      <p className="mb-3 text-sm text-amber-800/90">
        {t("minStayNights", { count: minStay })}
      </p>
    ) : null;

  const summary = (() => {
    if (!selectionStart || !selectionEnd) {
      return (
        <p className="text-sm text-muted">
          {focusField === "end" && selectionStart
            ? t("pickCheckout")
            : t("pickBoth")}
        </p>
      );
    }
    const nights = stayNightsBetween(selectionStart, selectionEnd);
    return (
      <div className="space-y-0.5 text-sm">
        <p className="text-charcoal">
          <span className="text-muted">{t("from")}:</span>{" "}
          <span className="font-medium">{formatDateKeyDisplay(selectionStart, locale)}</span>
        </p>
        <p className="text-charcoal">
          <span className="text-muted">{t("to")}:</span>{" "}
          <span className="font-medium">{formatDateKeyDisplay(selectionEnd, locale)}</span>
        </p>
        <p className="font-medium text-gold-dark">
          {t("nightsCount", { count: nights })}
        </p>
      </div>
    );
  })();

  const calendarBody = (
    <>
      {hoverMinStayHint}
      <AvailabilityCalendarPanel
        month={month}
        onPrevMonth={() => setMonth((m) => addMonths(m, -1))}
        onNextMonth={() => setMonth((m) => addMonths(m, 1))}
        periods={periods}
        mode="interest"
        selectionStart={selectionStart}
        selectionEnd={selectionEnd}
        onDateClick={handleDateClick}
        onDateHover={setHoverDate}
        minimumStayNights={minimumStayNights}
        showLegend={showLegend}
        showPrices={showPrices}
        priceForDate={priceForDate}
        isWeekendDay={isWeekendDay}
        layout={isMobile ? "single" : "dual"}
        unavailableDayStyle={unavailableDayStyle}
      />
    </>
  );

  const footerActions =
    presentation === "popover" ? (
      <div className="flex items-center justify-end border-t border-border/60 px-6 py-3">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal underline-offset-2 transition-colors hover:bg-charcoal/5 hover:underline"
        >
          {resolvedClearLabel}
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1 space-y-2">
          {summary}
          {minStayWarning}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="min-h-10 flex-1 rounded-xl border border-border px-4 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5 sm:flex-none"
          >
            {resolvedClearLabel}
          </button>
          {!autoApplyOnComplete && (
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="min-h-10 flex-1 rounded-xl bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
            >
              {isMobile ? resolvedMobileApplyLabel : resolvedApplyLabel}
            </button>
          )}
        </div>
      </div>
    );

  if (!open) return null;

  if (presentation === "popover") {
    return (
      <SearchFieldPopover
        open={open}
        onOpenChange={onOpenChange}
        anchorRef={anchorRef}
        ignoreRefs={ignoreRefs}
        placement="below-center"
        title={resolvedTitle || undefined}
        labelledBy={resolvedTitle ? titleId : undefined}
        preferredWidth={820}
        panelClassName="max-w-[min(820px,calc(100vw-48px))]"
        scrim
      >
        <div className="px-6 py-4">{calendarBody}</div>
        {footerActions}
      </SearchFieldPopover>
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center md:items-center md:p-6">
          <motion.button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-charcoal/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleRequestClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative flex w-full flex-col bg-white shadow-float",
              isMobile
                ? "max-h-[92dvh] rounded-t-[20px]"
                : "max-h-[min(90vh,820px)] max-w-[780px] rounded-[20px]"
            )}
            initial={isMobile ? { y: "100%" } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-border bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="font-display text-lg font-semibold text-charcoal sm:text-xl"
                  >
                    {isMobile ? resolvedMobileTitle : resolvedTitle}
                  </h2>
                  {!isMobile && (
                    <p className="mt-1 text-sm text-muted">{resolvedSubtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRequestClose}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-gold/35 hover:bg-gold/8"
                  aria-label={t("close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              {calendarBody}
            </div>

            <div className="sticky bottom-0 z-10 border-t border-border bg-white">
              {footerActions}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function formatTriggerDate(dateKey: string | undefined, addLabel = "Add", locale?: string): string {
  if (!dateKey) return addLabel;
  return formatDateKeyDisplay(dateKey, locale);
}

type TriggerProps = {
  value: DateRangeValue;
  onClick: () => void;
  className?: string;
  compact?: boolean;
  placeholder?: string;
};

export function DateRangeTriggerButton({
  value,
  onClick,
  className,
  compact = false,
  placeholder,
}: TriggerProps) {
  const t = useTranslations("Listing.datePicker");
  const locale = useLocale();
  const resolvedPlaceholder = placeholder ?? t("addDates");
  const label =
    value?.start && value?.end
      ? `${formatTriggerDate(value.start, t("add"), locale)} – ${formatTriggerDate(value.end, t("add"), locale)}`
      : resolvedPlaceholder;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full min-w-0 text-left text-sm text-charcoal outline-none",
        compact && "min-h-11 rounded-xl border border-border bg-white px-3 py-2",
        className
      )}
    >
      <span className={cn(!value && "text-muted/55")}>{label}</span>
    </button>
  );
}

export function DateRangeFromToTriggers({
  value,
  onOpenStart,
  onOpenEnd,
  fromClassName,
  toClassName,
  inputClass,
}: {
  value: DateRangeValue;
  onOpenStart: () => void;
  onOpenEnd: () => void;
  fromClassName?: string;
  toClassName?: string;
  inputClass?: string;
}) {
  const fromLabel = formatTriggerDate(value?.start);
  const toLabel = formatTriggerDate(value?.end);

  return (
    <>
      <button
        type="button"
        onClick={onOpenStart}
        className={cn(
          "w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none",
          inputClass,
          !value?.start && "text-muted/55",
          fromClassName
        )}
      >
        {fromLabel}
      </button>
      <button
        type="button"
        onClick={onOpenEnd}
        className={cn(
          "w-full min-w-0 bg-transparent text-left text-sm text-charcoal outline-none",
          inputClass,
          !value?.end && "text-muted/55",
          toClassName
        )}
      >
        {toLabel}
      </button>
    </>
  );
}
