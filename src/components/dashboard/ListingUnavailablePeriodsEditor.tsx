"use client";

import { useTranslations } from "next-intl";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUnavailablePeriodsManager } from "@/hooks/useUnavailablePeriodsManager";
import {
  addMonths,
  getFullMonthRange,
  getRangeFromToday,
  getUpcomingWeekendRange,
} from "@/lib/availability-calendar";
import type { RentalType } from "@/lib/rental-types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { cn } from "@/lib/utils";

const QUICK_ACTION_KEYS = [
  { id: "quickWeekend", getRange: () => getUpcomingWeekendRange() },
  { id: "quick7", getRange: () => getRangeFromToday(7) },
  { id: "quick14", getRange: () => getRangeFromToday(14) },
] as const;

type Props = {
  listingId: string;
  periods: ListingUnavailablePeriod[];
  rentalType?: RentalType;
};

export function ListingUnavailablePeriodsEditor({
  listingId,
  periods,
  rentalType = "monthly",
}: Props) {
  const t = useTranslations("Workspace.unavailablePeriods");
  const manager = useUnavailablePeriodsManager({ listingId, initialPeriods: periods });
  const isShortTerm = rentalType === "short_term";

  return (
    <GlassCard id="availability-calendar" className={cn("mb-6 p-6", isShortTerm && "ring-1 ring-gold/15")}>
      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal">{t("calendarTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("calendarHintEditor")}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
          <AvailabilityCalendarPanel
            month={manager.month}
            onPrevMonth={() => manager.setMonth((m) => addMonths(m, -1))}
            onNextMonth={() => manager.setMonth((m) => addMonths(m, 1))}
            periods={manager.items}
            mode="owner"
            selectionStart={manager.selectionStart}
            selectionEnd={manager.selectionEnd}
            onDateClick={manager.handleDateClick}
          />

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={manager.markSelectionUnavailable}
              disabled={!manager.selectionStart || manager.pending}
              className="rounded-xl bg-charcoal px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {manager.pending ? t("saving") : t("closeDates")}
            </button>
            <button
              type="button"
              onClick={manager.clearSelection}
              disabled={!manager.selectionStart}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("clearSelection")}
            </button>
            {manager.selectionLabel && (
              <p className="w-full text-xs text-muted sm:ml-auto sm:w-auto sm:self-center">
                {t("selectionLabel", { label: manager.selectionLabel })}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-sand/30 p-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("quickActionsTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {QUICK_ACTION_KEYS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={manager.pending}
                  onClick={() => manager.applyQuickRange(action.getRange)}
                  className="rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
                >
                  {t(action.id)}
                </button>
              ))}
              <button
                type="button"
                disabled={manager.pending}
                onClick={() => {
                  const range = getFullMonthRange(manager.month);
                  const start = range.start < manager.today ? manager.today : range.start;
                  manager.applyQuickRange(() => ({ start, end: range.end }));
                }}
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
              >
                {t("quickFullMonth")}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {manager.error && <p className="mt-4 text-sm text-red-500">{manager.error}</p>}

      {manager.toast && (
        <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-xl bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg">
          {manager.toast}
        </div>
      )}
    </GlassCard>
  );
}
