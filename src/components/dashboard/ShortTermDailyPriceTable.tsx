"use client";

import { addDays, todayDateKey } from "@/lib/availability-calendar";
import { cn } from "@/lib/utils";

type Props = {
  days?: number;
  priceForDate: (dateKey: string) => number | null;
  isCustomPrice?: (dateKey: string) => boolean;
  isBlocked?: (dateKey: string) => boolean;
  selectionStart?: string | null;
  selectionEnd?: string | null;
  onDateClick?: (dateKey: string) => void;
};

function formatRowDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("el-GR", { weekday: "short" });
  const label = date.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit" });
  return `${label} · ${weekday}`;
}

function isInSelection(
  dateKey: string,
  start: string | null | undefined,
  end: string | null | undefined
): boolean {
  if (!start) return false;
  if (!end || start === end) return dateKey === start;
  const lo = start < end ? start : end;
  const hi = start < end ? end : start;
  return dateKey >= lo && dateKey <= hi;
}

export function ShortTermDailyPriceTable({
  days = 30,
  priceForDate,
  isCustomPrice,
  isBlocked,
  selectionStart,
  selectionEnd,
  onDateClick,
}: Props) {
  const today = todayDateKey();
  const rows = Array.from({ length: days }, (_, i) => addDays(today, i));

  return (
    <div className="rounded-2xl border border-border bg-white shadow-soft">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-charcoal">
          Τιμές ανά ημέρα
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Επόμενες {days} ημέρες — πάτησε μια γραμμή για να την επεξεργαστείς στο ημερολόγιο.
        </p>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm">
            <tr className="text-left text-[11px] font-medium tracking-wide text-muted uppercase">
              <th className="px-4 py-2.5">Ημερομηνία</th>
              <th className="px-4 py-2.5">Κατάσταση</th>
              <th className="px-4 py-2.5 text-right">Τιμή / βράδυ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((dateKey) => {
              const blocked = isBlocked?.(dateKey) ?? false;
              const price = priceForDate(dateKey);
              const custom = !blocked && (isCustomPrice?.(dateKey) ?? false);
              const selected = isInSelection(dateKey, selectionStart, selectionEnd);
              const isToday = dateKey === today;

              return (
                <tr key={dateKey}>
                  <td colSpan={3} className="p-0">
                    <button
                      type="button"
                      onClick={() => onDateClick?.(dateKey)}
                      className={cn(
                        "grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border/60 px-4 py-2.5 text-left transition-colors hover:bg-gold/5",
                        selected && "bg-charcoal/8",
                        isToday && !selected && "bg-gold/5"
                      )}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          selected ? "text-charcoal" : "text-charcoal/90"
                        )}
                      >
                        {formatRowDate(dateKey)}
                        {isToday && (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-gold-dark">
                            Σήμερα
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          blocked ? "text-muted" : "text-teal"
                        )}
                      >
                        {blocked ? "Μη διαθέσιμο" : "Διαθέσιμο"}
                      </span>
                      <span
                        className={cn(
                          "min-w-[4.5rem] text-right font-semibold tabular-nums",
                          blocked
                            ? "text-muted"
                            : custom
                              ? "text-gold-dark"
                              : price != null
                                ? "text-charcoal"
                                : "text-muted"
                        )}
                      >
                        {blocked ? "—" : price != null ? `€${price.toLocaleString("el-GR")}` : "—"}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
