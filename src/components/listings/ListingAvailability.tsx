import { CalendarCheck, CalendarX } from "lucide-react";
import {
  formatListingAvailability,
  formatListingAvailabilityLabel,
  isListingAvailableForStay,
  isListingCurrentlyAvailable,
} from "@/lib/availability";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: Pick<
    Listing,
    | "availability_status"
    | "availability_note"
    | "available_from"
    | "available_until"
    | "min_months"
  >;
  moveIn?: string;
  months?: number;
  className?: string;
  size?: "sm" | "md";
  withLabel?: boolean;
};

export function ListingAvailability({
  listing,
  moveIn,
  months,
  className,
  size = "sm",
  withLabel = false,
}: Props) {
  const available =
    moveIn && months
      ? isListingAvailableForStay(listing, moveIn, months)
      : isListingCurrentlyAvailable(listing);

  const label =
    moveIn && months
      ? formatListingAvailability(listing, { moveIn, months })
      : withLabel
        ? formatListingAvailabilityLabel(listing)
        : formatListingAvailability(listing);

  const Icon = available ? CalendarCheck : CalendarX;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5",
        size === "sm" ? "text-xs" : "text-sm",
        available ? "text-charcoal/70" : "text-red-500/80",
        className
      )}
    >
      <Icon className={cn("shrink-0 text-gold", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span>{label}</span>
    </p>
  );
}
