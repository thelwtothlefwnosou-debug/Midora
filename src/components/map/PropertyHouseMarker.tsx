"use client";

import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Exact public pin vs approximate area pin */
  exact?: boolean;
  className?: string;
};

/** Premium house pin for listing detail maps. */
export function PropertyHouseMarker({ exact = false, className }: Props) {
  return (
    <div
      className={cn(
        "property-house-marker pointer-events-none",
        exact && "property-house-marker--exact",
        className
      )}
      aria-hidden
    >
      <div className="property-house-marker__bubble">
        <Home className="property-house-marker__icon" strokeWidth={2.25} />
      </div>
      <div className="property-house-marker__stem" />
      <div className="property-house-marker__shadow" />
    </div>
  );
}
