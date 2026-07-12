"use client";

import { BarChart3, Eye } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
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
      <h2 className="mb-1 font-display text-base font-semibold text-charcoal">Στατιστικά</h2>
      <p className="mb-4 text-sm text-muted">
        Πραγματικά δεδομένα προβολών — χωρίς ταυτότητα επισκεπτών.
      </p>

      {!hasData ? (
        <DashboardEmptyState
          compact
          icon={BarChart3}
          title="Χωρίς στατιστικά ακόμα"
          text="Δεν υπάρχουν ακόμη αρκετά δεδομένα προβολών. Τα στατιστικά θα εμφανιστούν όταν η αγγελία λάβει επισκέψεις."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="rounded-xl border border-border bg-white px-4 py-3.5 shadow-soft">
      <Icon className="h-4 w-4 text-muted" />
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-charcoal">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
