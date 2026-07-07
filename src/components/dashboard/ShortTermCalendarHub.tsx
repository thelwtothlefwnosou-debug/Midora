"use client";

import { useMemo, useState } from "react";
import { Euro, Lock, Unlock } from "lucide-react";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePriceRulesManager } from "@/hooks/usePriceRulesManager";
import { useUnavailablePeriodsManager } from "@/hooks/useUnavailablePeriodsManager";
import {
  addMonths,
  getRangeFromToday,
  getUpcomingWeekendRange,
  normalizeDateRange,
} from "@/lib/availability-calendar";
import { formatUnavailablePeriodRange } from "@/lib/unavailable-periods";
import type { ListingPriceRule, ListingWithImages } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";

type Props = {
  listing: ListingWithImages;
  periods: ListingUnavailablePeriod[];
  priceRules: ListingPriceRule[];
};

const AVAILABILITY_QUICK = [
  { label: "Κλείσε αυτό το Σαββατοκύριακο", getRange: () => getUpcomingWeekendRange() },
  { label: "Κλείσε 7 ημέρες", getRange: () => getRangeFromToday(7) },
  { label: "Κλείσε 14 ημέρες", getRange: () => getRangeFromToday(14) },
] as const;

export function ShortTermCalendarHub({ listing, periods, priceRules }: Props) {
  const basePrice = listing.price_per_night ?? 0;

  const [month, setMonth] = useState(() => new Date());
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);

  const availability = useUnavailablePeriodsManager({
    listingId: listing.id,
    initialPeriods: periods,
  });

  const pricing = usePriceRulesManager({
    listingId: listing.id,
    basePricePerNight: basePrice,
    initialRules: priceRules,
  });

  const selectionLabel = useMemo(() => {
    if (!selectionStart) return null;
    if (selectionEnd) {
      const { start, end } = normalizeDateRange(selectionStart, selectionEnd);
      return formatUnavailablePeriodRange(start, end);
    }
    return formatUnavailablePeriodRange(selectionStart, selectionStart);
  }, [selectionStart, selectionEnd]);

  const hasCustomInSelection = pricing.selectionHasCustomPrice(selectionStart, selectionEnd);
  const pending = availability.pending || pricing.pending;

  function clearSelection() {
    setSelectionStart(null);
    setSelectionEnd(null);
  }

  function handleDateClick(dateKey: string) {
    if (dateKey < pricing.today) return;

    const blocked = availability.items.find(
      (p) => dateKey >= p.start_date && dateKey <= p.end_date
    );
    if (blocked) {
      const label = formatUnavailablePeriodRange(blocked.start_date, blocked.end_date);
      if (!confirm(`Να γίνουν ξανά διαθέσιμες οι ημερομηνίες ${label};`)) return;
      availability.handleDelete(blocked.id, { skipConfirm: true });
      clearSelection();
      return;
    }

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(dateKey);
      setSelectionEnd(null);
      pricing.setPriceInput(String((pricing.priceForDate(dateKey) ?? basePrice) || ""));
      return;
    }

    const { start, end } = normalizeDateRange(selectionStart, dateKey);
    setSelectionStart(start);
    setSelectionEnd(end);
    pricing.setPriceInput(String((pricing.priceForDate(start) ?? basePrice) || ""));
  }

  function blockSelection() {
    if (!selectionStart) return;
    const { start, end } = selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd)
      : { start: selectionStart, end: selectionStart };
    availability.blockRange(start, end, clearSelection);
  }

  function applyWeekendPrice() {
    const range = getUpcomingWeekendRange();
    const start = range.start < pricing.today ? pricing.today : range.start;
    setSelectionStart(start);
    setSelectionEnd(range.end);
    pricing.setPriceInput(String(pricing.suggestWeekendPrice()));
  }

  return (
    <GlassCard id="availability-calendar" className="mb-6 p-6 ring-1 ring-gold/15">
      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Ημερολόγιο βραχυχρόνιας μίσθωσης
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Κάθε μέρα δείχνει την τιμή ανά βράδυ. Επίλεξε ημερομηνίες για να αλλάξεις τιμή ή να
          τις κλείσεις.
        </p>
        {basePrice > 0 ? (
          <p className="mt-2 text-sm text-charcoal">
            Βασική τιμή:{" "}
            <span className="font-semibold">€{basePrice.toLocaleString("el-GR")}</span> / βράδυ
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            Ορίσε βασική τιμή / βράδυ στην αγγελία για να εμφανίζονται οι τιμές στο ημερολόγιο.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
          <AvailabilityCalendarPanel
            month={month}
            onPrevMonth={() => setMonth((m) => addMonths(m, -1))}
            onNextMonth={() => setMonth((m) => addMonths(m, 1))}
            periods={availability.items}
            mode="owner"
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            onDateClick={handleDateClick}
            showPrices
            priceCellSize="large"
            layout="single"
            priceForDate={pricing.priceForDate}
            isCustomPrice={pricing.isCustomPrice}
          />

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-sand/30 px-3 py-2">
                <Euro className="h-4 w-4 text-teal" />
                <span className="text-xs text-muted">€ / βράδυ</span>
                <input
                  type="number"
                  min={1}
                  value={pricing.priceInput}
                  onChange={(e) => pricing.setPriceInput(e.target.value)}
                  placeholder={basePrice > 0 ? String(basePrice) : "Τιμή"}
                  className="w-24 bg-transparent text-sm font-semibold text-charcoal outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  pricing.applyPriceToSelection(selectionStart, selectionEnd, clearSelection)
                }
                disabled={!selectionStart || pending}
                className="min-h-11 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "Αποθήκευση…" : "Εφαρμογή τιμής"}
              </button>
              {hasCustomInSelection && (
                <button
                  type="button"
                  onClick={() =>
                    pricing.resetCustomPriceForSelection(
                      selectionStart,
                      selectionEnd,
                      clearSelection
                    )
                  }
                  disabled={!selectionStart || pending}
                  className="min-h-11 rounded-xl border border-teal/30 px-4 py-2.5 text-sm font-medium text-teal hover:bg-teal/5 disabled:opacity-40"
                >
                  Επαναφορά βασικής
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={blockSelection}
                disabled={!selectionStart || pending}
                className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock className="h-4 w-4" />
                {pending ? "Αποθήκευση…" : "Κλείσιμο ημερομηνιών"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={!selectionStart}
                className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand/50 disabled:opacity-40"
              >
                Καθαρισμός επιλογής
              </button>
            </div>

            {selectionLabel && (
              <p className="text-xs text-muted">Επιλογή: {selectionLabel}</p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-sand/30 p-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              Γρήγορες τιμές
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={applyWeekendPrice}
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-charcoal hover:border-teal/30 disabled:opacity-50"
              >
                Επιλογή Σαββατοκύριακου (+25%)
              </button>
              <button
                type="button"
                disabled={pending || !selectionStart}
                onClick={() =>
                  pricing.setPriceInput(String(pricing.suggestWeekendPrice()))
                }
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-charcoal hover:border-teal/30 disabled:opacity-50"
              >
                Πρόταση τιμής για την επιλογή
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Οι ειδικές τιμές εμφανίζονται πράσινες στο ημερολόγιο.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-sand/30 p-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              Διαθεσιμότητα
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {AVAILABILITY_QUICK.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={pending}
                  onClick={() => availability.applyQuickRange(action.getRange)}
                  className="rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
              <Unlock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Πάτησε χρυσή ημερομηνία για να την ανοίξεις ξανά.
            </p>
          </div>

          {pricing.rules.length > 0 && (
            <div className="rounded-2xl border border-border bg-sand/30 p-4">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                Ειδικές τιμές ({pricing.rules.length})
              </p>
              <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                {pricing.rules.map((rule) => (
                  <li
                    key={rule.id}
                    className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-charcoal"
                  >
                    {formatUnavailablePeriodRange(rule.start_date, rule.end_date)}
                    <span className="ml-1 font-semibold text-teal">
                      €{rule.price_per_night?.toLocaleString("el-GR")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {(availability.error || pricing.error) && (
        <p className="mt-4 text-sm text-red-500">{availability.error ?? pricing.error}</p>
      )}

      {(availability.toast || pricing.toast) && (
        <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-xl bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg">
          {availability.toast ?? pricing.toast}
        </div>
      )}
    </GlassCard>
  );
}
