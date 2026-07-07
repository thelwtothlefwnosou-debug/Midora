import { badgeClassName, getListingBadges, type ListingBadge } from "@/lib/listing-badges";
import type { ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ListingCardBadges({
  listing,
  badges,
  className,
  variant = "default",
}: {
  listing?: ListingWithImages;
  badges?: ListingBadge[];
  className?: string;
  variant?: "default" | "home";
}) {
  const display = badges ?? (listing ? getListingBadges(listing) : []);
  if (display.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 left-2 z-10 flex max-w-[75%] flex-wrap gap-1",
        className
      )}
    >
      {display.map((b) => (
        <span
          key={`${b.kind}-${b.label}`}
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow-[0_1px_3px_rgba(26,26,26,0.08)] backdrop-blur-[2px]",
            b.kind === "checked" && variant === "home" && "px-1.5 py-0.5 text-[9px]",
            badgeClassName(b.kind, variant)
          )}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
