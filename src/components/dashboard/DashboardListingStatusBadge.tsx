import { cn } from "@/lib/utils";
import type { OwnerListingUiStatus } from "@/lib/owner-listing-ui-status";

type Props = {
  statusKey: OwnerListingUiStatus;
  label: string;
  helperText?: string | null;
  compact?: boolean;
  className?: string;
};

/** Listing status badge — colors from globals.css (.owner-status-*), never weak gray for draft. */
export function DashboardListingStatusBadge({
  statusKey,
  label,
  helperText,
  compact = false,
  className,
}: Props) {
  const badgeClass = `owner-status-badge owner-status-badge--${statusKey}`;

  if (compact) {
    return (
      <span className={cn(badgeClass, className)}>
        <span className="owner-status-dot" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span className={badgeClass}>
        <span className="owner-status-dot" aria-hidden />
        {label}
      </span>
      {helperText ? (
        <p className="text-[12px] leading-snug text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
