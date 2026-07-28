import Link from "next/link";
import { useTranslations } from "next-intl";
import type { OwnerListingsOverview } from "@/lib/owner-listings-page";
import { formatAnalyticsMetric } from "@/lib/owner-listing-analytics";
import { cn } from "@/lib/utils";

type Props = {
  overview: OwnerListingsOverview;
};

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <>
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold tabular-nums",
          highlight ? "text-gold-dark" : "text-charcoal"
        )}
      >
        {value}
      </p>
    </>
  );

  const className =
    "rounded-xl border border-border bg-white px-4 py-3 shadow-soft transition-colors hover:border-gold/25";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function DashboardListingsOverviewMetrics({ overview }: Props) {
  const t = useTranslations("Owner.overviewMetrics");
  const viewsLabel =
    overview.viewsLast30Days != null
      ? formatAnalyticsMetric(overview.viewsLast30Days)
      : "—";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={t("activeListings")} value={String(overview.activeCount)} />
      <StatCard
        label={t("viewsTotalActive")}
        value={viewsLabel}
      />
      <StatCard
        label={t("newRequests")}
        value={String(overview.newInquiries)}
        href={overview.newInquiries > 0 ? "/dashboard/requests" : undefined}
        highlight={overview.newInquiries > 0}
      />
      <StatCard
        label={t("needsAction")}
        value={String(overview.needsActionCount)}
        highlight={overview.needsActionCount > 0}
      />
    </div>
  );
}
