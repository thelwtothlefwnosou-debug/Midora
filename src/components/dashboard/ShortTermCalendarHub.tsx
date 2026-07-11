"use client";

import { useMemo, useState } from "react";
import { Euro, Lock, Unlock, Calendar, X } from "lucide-react";
import { AvailabilityCalendarPanel } from "@/components/availability/AvailabilityCalendarGrid";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShortTermPricingSettings } from "@/components/dashboard/ShortTermPricingSettings";
import { ShortTermSpecialPeriodForm } from "@/components/dashboard/ShortTermSpecialPeriodForm";
import { OwnerPricePreview } from "@/components/dashboard/OwnerPricePreview";
import { ShortTermDailyPriceTable } from "@/components/dashboard/ShortTermDailyPriceTable";
import { usePriceRulesManager } from "@/hooks/usePriceRulesManager";
import { useUnavailablePeriodsManager } from "@/hooks/useUnavailablePeriodsManager";
import {
  addMonths,
  getRangeFromToday,
  getUpcomingWeekendRange,
  normalizeDateRange,
  todayDateKey,
} from "@/lib/availability-calendar";
import { computeIndicativeStayPrice, makeWeekendDayChecker } from "@/lib/listing-short-term-price";
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
  const [panelTab, setPanelTab] = useState<"selection" | "settings">("selection");
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const availability = useUnavailablePeriodsManager({
    listingId: listing.id,
    initialPeriods: periods,
  });

  const pricing = usePriceRulesManager({
    listingId: listing.id,
    pricing: listing,
    periods: availability.items,
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

  const indicativePreview = useMemo(() => {
    if (!selectionStart) return null;
    const { start, end } = selectionEnd
      ? normalizeDateRange(selectionStart, selectionEnd)
      : { start: selectionStart, end: selectionStart };
    if (start === end) return null;
    return computeIndicativeStayPrice(
      listing,
      pricing.rules,
      start,
      end,
      listing.included_guests ?? 2,
      availability.items
    );
  }, [selectionStart, selectionEnd, listing, pricing.rules, availability.items]);

  const hasCustomInSelection = pricing.selectionHasCustomPrice(selectionStart, selectionEnd);
  const pending = availability.pending || pricing.pending;
  const isWeekendDay = useMemo(
    () => makeWeekendDayChecker(listing.weekend_days),
    [listing.weekend_days]
  );

  function clearSelection() {
    setSelectionStart(null);
    setSelectionEnd(null);
  }

  function goToday() {
    setMonth(new Date());
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

    setPanelTab("selection");

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(dateKey);
      setSelectionEnd(null);
      pricing.setPriceInput(String(pricing.priceForDate(dateKey) ?? basePrice));
      return;
    }

    const { start, end } = normalizeDateRange(selectionStart, dateKey);
    setSelectionStart(start);
    setSelectionEnd(end);
    pricing.setPriceInput(String(pricing.priceForDate(start) ?? basePrice));
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
    setPanelTab("selection");
  }

  return (
    <GlassCard id="availability-calendar" className="mb-6 p-6 ring-1 ring-gold/15">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Ημερολόγιο τιμών και διαθεσιμότητας
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
              Ορίσε βασική τιμή στις ρυθμίσεις δεξιά για να εμφανίζονται οι τιμές.
            </p>
          )}
          {pricing.rules.length === 0 && basePrice > 0 && (
            <p className="mt-1 text-xs text-muted">
              Όλες οι διαθέσιμες ημέρες χρησιμοποιούν τη βασική τιμή.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPanelTab("settings");
              setMobileSettingsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-charcoal hover:bg-sand xl:hidden"
          >
            Τιμές & κανόνες
          </button>
          <button
            type="button"
            onClick={goToday}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-charcoal hover:bg-sand"
          >
            <Calendar className="h-3.5 w-3.5" />
            Σήμερα
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
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
            layout="responsive"
            priceForDate={pricing.priceForDate}
            isCustomPrice={pricing.isCustomPrice}
            isWeekendDay={isWeekendDay}
          />

          {selectionLabel && (
            <p className="mt-4 text-xs text-muted">Επιλογή: {selectionLabel}</p>
          )}

          <div className="mt-5">
            <ShortTermDailyPriceTable
              priceForDate={pricing.priceForDate}
              isCustomPrice={pricing.isCustomPrice}
              isBlocked={(dateKey) =>
                availability.items.some(
                  (p) => dateKey >= p.start_date && dateKey <= p.end_date
                )
              }
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onDateClick={handleDateClick}
            />
          </div>
        </div>

        <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
          <div className="flex rounded-xl border border-border bg-sand/30 p-1">
            <button
              type="button"
              onClick={() => setPanelTab("selection")}
              className={`flex-1 rounded-lg py-2 text-xs font-medium ${
                panelTab === "selection" ? "bg-white text-charcoal shadow-sm" : "text-muted"
              }`}
            >
              Επιλογή
            </button>
            <button
              type="button"
              onClick={() => setPanelTab("settings")}
              className={`flex-1 rounded-lg py-2 text-xs font-medium ${
                panelTab === "settings" ? "bg-white text-charcoal shadow-sm" : "text-muted"
              }`}
            >
              Τιμές & κανόνες
            </button>
          </div>

          {panelTab === "selection" ? (
            <>
              <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  {selectionStart ? "Επεξεργασία επιλογής" : "Επίλεξε ημερομηνίες"}
                </p>

                {selectionStart ? (
                  <div className="mt-3 space-y-3">
                    <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-sand/30 px-3 py-2">
                      <Euro className="h-4 w-4 text-gold" />
                      <span className="text-xs text-muted">€ / βράδυ</span>
                      <input
                        type="number"
                        min={1}
                        value={pricing.priceInput}
                        onChange={(e) => pricing.setPriceInput(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-charcoal outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        pricing.applyPriceToSelection(selectionStart, selectionEnd, clearSelection)
                      }
                      disabled={pending}
                      className="w-full rounded-xl bg-gold py-2.5 text-sm font-semibold text-white hover:bg-gold-dark disabled:opacity-50"
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
                        disabled={pending}
                        className="w-full rounded-xl border border-border py-2 text-sm text-teal hover:bg-teal/5 disabled:opacity-50"
                      >
                        Επαναφορά βασικής τιμής
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={blockSelection}
                      disabled={pending}
                      className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-charcoal py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      Κλείσιμο ημερομηνιών
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="w-full rounded-xl border border-border py-2 text-sm text-muted hover:bg-sand"
                    >
                      Καθαρισμός επιλογής
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Πάτησε μία ή περισσότερες ημερομηνίες στο ημερολόγιο.
                  </p>
                )}

                {indicativePreview && (
                  <div className="mt-4">
                    <OwnerPricePreview price={indicativePreview} variant="owner" />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-sand/30 p-4">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  Γρήγορες ενέργειες
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={applyWeekendPrice}
                    className="rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
                  >
                    Επιλογή Σαββατοκύριακου
                  </button>
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

              <div className="rounded-2xl border border-border bg-white p-4">
                <ShortTermSpecialPeriodForm listingId={listing.id} />
              </div>

              {pricing.rules.length > 0 && (
                <div className="rounded-2xl border border-border bg-sand/30 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    Ειδικές περίοδοι ({pricing.rules.length})
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                    {pricing.rules.map((rule) => (
                      <li
                        key={rule.id}
                        className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-charcoal"
                      >
                        {rule.label || formatUnavailablePeriodRange(rule.start_date, rule.end_date)}
                        <span className="ml-1 font-semibold text-gold">
                          €{rule.price_per_night?.toLocaleString("el-GR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <ShortTermPricingSettings listing={listing} />
            </div>
          )}
        </aside>
      </div>

      {selectionStart && (
        <div className="fixed inset-x-0 bottom-0 z-[120] max-h-[75dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.18)] xl:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                Επεξεργασία επιλογής
              </p>
              {selectionLabel && (
                <p className="mt-1 text-sm font-medium text-charcoal">{selectionLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted"
              aria-label="Κλείσιμο"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-sand/30 px-3 py-2">
              <Euro className="h-4 w-4 text-gold" />
              <span className="text-xs text-muted">€ / βράδυ</span>
              <input
                type="number"
                min={1}
                value={pricing.priceInput}
                onChange={(e) => pricing.setPriceInput(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-charcoal outline-none"
              />
            </label>

            {indicativePreview && <OwnerPricePreview price={indicativePreview} variant="owner" />}

            <button
              type="button"
              onClick={() =>
                pricing.applyPriceToSelection(selectionStart, selectionEnd, clearSelection)
              }
              disabled={pending}
              className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white hover:bg-gold-dark disabled:opacity-50"
            >
              {pending ? "Αποθήκευση…" : "Εφαρμογή τιμής"}
            </button>
            {hasCustomInSelection && (
              <button
                type="button"
                onClick={() =>
                  pricing.resetCustomPriceForSelection(selectionStart, selectionEnd, clearSelection)
                }
                disabled={pending}
                className="w-full rounded-xl border border-border py-2.5 text-sm text-teal disabled:opacity-50"
              >
                Επαναφορά βασικής τιμής
              </button>
            )}
            <button
              type="button"
              onClick={blockSelection}
              disabled={pending}
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-charcoal py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              Κλείσιμο ημερομηνιών
            </button>
          </div>
        </div>
      )}

      {mobileSettingsOpen && (
        <div className="fixed inset-0 z-[125] flex flex-col bg-white xl:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-base font-semibold text-charcoal">Τιμές & κανόνες</p>
            <button
              type="button"
              onClick={() => setMobileSettingsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
              aria-label="Κλείσιμο"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ShortTermPricingSettings
              listing={listing}
              onSaved={() => setMobileSettingsOpen(false)}
            />
            <div className="mt-6 rounded-2xl border border-border bg-sand/30 p-4">
              <ShortTermSpecialPeriodForm listingId={listing.id} />
            </div>
          </div>
        </div>
      )}

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
