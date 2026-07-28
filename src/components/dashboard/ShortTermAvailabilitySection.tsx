"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { useUnavailablePeriodsManager } from "@/hooks/useUnavailablePeriodsManager";
import {
  addMonths,
  getRangeFromToday,
  getUpcomingWeekendRange,
} from "@/lib/availability-calendar";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn } from "@/lib/utils";

const QUICK_ACTION_KEYS = [
  { id: "quickWeekend", getRange: () => getUpcomingWeekendRange() },
  { id: "quick7", getRange: () => getRangeFromToday(7) },
  { id: "quick14", getRange: () => getRangeFromToday(14) },
] as const;

type Manager = ReturnType<typeof useUnavailablePeriodsManager>;

type ModalProps = {
  manager: Manager;
  onClose: () => void;
};

export function ShortTermCalendarModal({ manager, onClose }: ModalProps) {
  const t = useTranslations("Workspace.unavailablePeriods");

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-white sm:bg-charcoal/45"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 hidden sm:block"
        aria-label={t("close")}
        onClick={onClose}
      />
      <div className="relative flex min-h-0 flex-1 flex-col sm:mx-auto sm:my-auto sm:max-h-[92dvh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:bg-white sm:shadow-2xl">
        <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal">
                {t("calendarTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted">{t("calendarHintModal")}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-charcoal"
            >
              {t("close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
          <div className="rounded-2xl border border-border bg-white p-3 sm:p-5">
            <AvailabilityCalendarPanel
              month={manager.month}
              onPrevMonth={() => manager.setMonth((m) => addMonths(m, -1))}
              onNextMonth={() => manager.setMonth((m) => addMonths(m, 1))}
              periods={manager.items}
              mode="owner"
              selectionStart={manager.selectionStart}
              selectionEnd={manager.selectionEnd}
              onDateClick={manager.handleDateClick}
              layout="responsive"
            />
          </div>

          <aside className="mt-4 space-y-2 sm:hidden">
            {QUICK_ACTION_KEYS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={manager.pending}
                onClick={() => manager.applyQuickRange(action.getRange)}
                className="w-full rounded-xl border border-border bg-sand/30 px-3 py-2.5 text-left text-xs font-medium text-charcoal disabled:opacity-50"
              >
                {t(action.id)}
              </button>
            ))}
          </aside>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-border bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={manager.markSelectionUnavailable}
              disabled={!manager.selectionStart || manager.pending}
              className="min-h-11 flex-1 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 sm:flex-none"
            >
              {manager.pending ? t("saving") : t("closeDates")}
            </button>
            <button
              type="button"
              onClick={manager.clearSelection}
              disabled={!manager.selectionStart}
              className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm"
            >
              {t("clearSelection")}
            </button>
          </div>
          {manager.selectionLabel && (
            <p className="mt-2 text-xs text-muted">
              {t("selectionLabel", { label: manager.selectionLabel })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCalendarLegend() {
  const t = useTranslations("Workspace.unavailablePeriods");

  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-sm bg-gold/35" />
        {t("legendUnavailable")}
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-gold" />
        {t("legendSelected")}
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full opacity-35 ring-1 ring-border" />
        {t("legendPast")}
      </span>
    </div>
  );
}

type SectionProps = {
  listingId: string;
  periods: ListingUnavailablePeriod[];
  compact?: boolean;
  embedded?: boolean;
  className?: string;
};

export function ShortTermAvailabilitySection({
  listingId,
  periods,
  compact = true,
  embedded = false,
  className,
}: SectionProps) {
  const t = useTranslations("Workspace.unavailablePeriods");
  const manager = useUnavailablePeriodsManager({ listingId, initialPeriods: periods });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const summary =
    manager.items.length === 0
      ? t("summaryNone")
      : manager.items.length === 1
        ? t("summaryOne")
        : t("summaryMany", { count: manager.items.length });

  return (
    <>
      <div
        className={cn(
          !embedded && "rounded-xl border border-border bg-sand/40",
          compact && !embedded ? "p-3" : !embedded ? "p-4" : "",
          className
        )}
      >
        {!embedded && (
          <>
            <p className="text-xs font-medium text-charcoal">{t("sectionTitleShortTerm")}</p>
            <p className="mt-1 text-[11px] text-muted">{summary}</p>
          </>
        )}
        {embedded && <p className="mb-2 text-[11px] text-muted">{summary}</p>}

        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-white p-1.5 sm:p-2">
          <AvailabilityCalendarPanel
            month={manager.month}
            onPrevMonth={() => manager.setMonth((m) => addMonths(m, -1))}
            onNextMonth={() => manager.setMonth((m) => addMonths(m, 1))}
            periods={manager.items}
            mode="owner"
            selectionStart={manager.selectionStart}
            selectionEnd={manager.selectionEnd}
            onDateClick={manager.handleDateClick}
            hideNav
            layout="dual"
            showLegend={false}
            compact
          />
          <MiniCalendarLegend />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-charcoal hover:border-gold/30"
          >
            {t("manageCalendar")}
          </button>
          <button
            type="button"
            onClick={manager.markSelectionUnavailable}
            disabled={!manager.selectionStart || manager.pending}
            className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {manager.pending ? t("saving") : t("closeDates")}
          </button>
        </div>
      </div>

      {calendarOpen && (
        <ShortTermCalendarModal manager={manager} onClose={() => setCalendarOpen(false)} />
      )}

      {manager.error && <p className="mt-3 text-sm text-red-500">{manager.error}</p>}

      {manager.toast && (
        <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-xl bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg">
          {manager.toast}
        </div>
      )}
    </>
  );
}
