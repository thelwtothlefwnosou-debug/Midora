import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  OwnerListingStatusKey,
  { badge: string; dot: string }
> = {
  draft: {
    badge: "border-border bg-sand/60 text-charcoal/75",
    dot: "bg-charcoal/40",
  },
  review: {
    badge: "border-gold/30 bg-gold/10 text-gold-dark",
    dot: "bg-gold",
  },
  needs_fixes: {
    badge: "border-orange-200 bg-orange-50 text-orange-800",
    dot: "bg-orange-500",
  },
  published: {
    badge: "border-teal/25 bg-teal/10 text-teal",
    dot: "bg-teal",
  },
  paused: {
    badge: "border-border bg-sand/50 text-charcoal/60",
    dot: "bg-charcoal/35",
  },
  expired: {
    badge: "border-charcoal/15 bg-charcoal/5 text-charcoal/70",
    dot: "bg-charcoal/50",
  },
  rejected: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

type Props = {
  statusKey: OwnerListingStatusKey;
  label: string;
  helperText?: string | null;
  compact?: boolean;
  className?: string;
};

export function DashboardListingStatusBadge({
  statusKey,
  label,
  helperText,
  compact = false,
  className,
}: Props) {
  const styles = STATUS_STYLES[statusKey] ?? STATUS_STYLES.draft;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[10px] font-semibold",
          styles.badge,
          className
        )}
      >
        <span className={cn("h-1 w-1 rounded-full", styles.dot)} aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
          styles.badge
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} aria-hidden />
        {label}
      </span>
      {helperText ? (
        <p className="text-[11px] leading-snug text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
