import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { OwnerListingAlert } from "@/lib/owner-listings-page";
import { cn } from "@/lib/utils";

type Props = {
  alerts: OwnerListingAlert[];
};

export function DashboardListingsSmartAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 4).map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            alert.tone === "amber"
              ? "border-amber-200/80 bg-amber-50/80"
              : alert.tone === "gold"
                ? "border-gold/25 bg-gold/5"
                : "border-border bg-white"
          )}
        >
          <p className="flex min-w-0 items-start gap-2 text-charcoal">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
            <span>{alert.message}</span>
          </p>
          <Link
            href={alert.href}
            className="shrink-0 text-sm font-semibold text-gold-dark hover:underline"
          >
            {alert.cta}
          </Link>
        </div>
      ))}
    </div>
  );
}
