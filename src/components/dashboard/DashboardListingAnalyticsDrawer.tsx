"use client";

import { useEffect } from "react";
import { X, Eye, Inbox } from "lucide-react";
import type { ListingAnalytics } from "@/lib/owner-listing-analytics";
import { formatAnalyticsMetric } from "@/lib/owner-listing-analytics";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  analytics: ListingAnalytics;
};

export function DashboardListingAnalyticsDrawer({
  open,
  onClose,
  title,
  analytics,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-charcoal/30"
        aria-label="Κλείσιμο"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium text-muted">Στατιστικά αγγελίας</p>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-charcoal">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/60 hover:bg-sand"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs text-muted">
            Συγκεντρωτικά δεδομένα από πραγματικές προβολές και αιτήματα επικοινωνίας.
            Δεν εμφανίζονται στοιχεία ταυτότητας επισκεπτών.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricBlock
              icon={Eye}
              label="Συνολικές προβολές"
              value={formatAnalyticsMetric(analytics.viewsTotal)}
              note={
                analytics.viewsTotal == null
                  ? "Δεν υπάρχουν δεδομένα ακόμα"
                  : "Μετράται μετά ουσιαστική παραμονή στη σελίδα"
              }
            />
            <MetricBlock
              icon={Inbox}
              label="Αιτήματα (30 ημέρες)"
              value={formatAnalyticsMetric(
                analytics.inquiriesLast30Days > 0 ? analytics.inquiriesLast30Days : null
              )}
              note={
                analytics.inquiriesLast30Days > 0
                  ? `${analytics.inquiriesTotal} σύνολο`
                  : analytics.inquiriesTotal > 0
                    ? `${analytics.inquiriesTotal} σύνολο · χωρίς νέα τελευταίες 30 ημέρες`
                    : "Δεν υπάρχουν αιτήματα ακόμα"
              }
            />
          </div>

          {analytics.unreadInquiries > 0 && (
            <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-charcoal">
              {analytics.unreadInquiries}{" "}
              {analytics.unreadInquiries === 1 ? "νέο αίτημα" : "νέα αιτήματα"} χωρίς απάντηση
            </div>
          )}

          <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
            Αναλυτικά γραφήματα ανά ημέρα θα προστεθούν όταν συγκεντρωθούν περισσότερα
            ιστορικά δεδομένα.
          </div>
        </div>
      </aside>
    </>
  );
}

function MetricBlock({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-cream/20 p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn("mt-2 font-display text-2xl font-semibold tabular-nums text-charcoal")}>
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted">{note}</p>
    </div>
  );
}
