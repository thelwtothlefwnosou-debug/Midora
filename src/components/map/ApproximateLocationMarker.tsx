"use client";

import { cn } from "@/lib/utils";

type Props = {
  variant?: "gold" | "charcoal";
  showRadius?: boolean;
  className?: string;
};

export function ApproximateLocationMarker({
  variant = "gold",
  showRadius = true,
  className,
}: Props) {
  return (
    <div className={cn("approx-location-marker", className)} aria-hidden>
      {showRadius ? <div className="approx-location-marker__radius" /> : null}
      <div
        className={cn(
          "approx-location-marker__pin",
          variant === "gold"
            ? "approx-location-marker__pin--gold"
            : "approx-location-marker__pin--charcoal"
        )}
      />
    </div>
  );
}
