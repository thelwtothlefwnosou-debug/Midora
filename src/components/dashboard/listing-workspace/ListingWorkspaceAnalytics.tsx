"use client";

import { Eye } from "lucide-react";
import type { ListingWorkspaceContext } from "@/lib/listing-workspace-types";
import {
  buildListingAnalytics,
  formatAnalyticsMetric,
  hasListingPerformanceData,
} from "@/lib/owner-listing-analytics";

type Props = {
  ctx: ListingWorkspaceContext;
};

export function ListingWorkspaceAnalytics({ ctx }: Props) {
  const analytics = buildListingAnalytics(
    ctx.listing,
    ctx.effectiveStatus,
    ctx.ownerStatusKey
  );
  const hasData = hasListingPerformanceData(analytics);

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-semibold text-charcoal">Στατιστικά</h2>
      <p className="mb-5 text-sm text-muted">
        Πραγματικά δεδομένα προβολών — χωρίς ταυτότητα επισκεπτών.
      </p>

      {!hasData ? (
        <p className="rounded-xl border border-border bg-white px-5 py-8 text-center text-sm text-muted shadow-soft">
          Δεν υπάρχουν ακόμη αρκετά δεδομένα προβολών.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={Eye}
            value={formatAnalyticsMetric(analytics.viewsTotal)}
            label="Προβολές · σύνολο"
          />
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Eye;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4 shadow-soft">
      <Icon className="h-4 w-4 text-muted" />
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-charcoal">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
