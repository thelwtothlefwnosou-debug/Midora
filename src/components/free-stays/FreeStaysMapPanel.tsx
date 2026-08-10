"use client";

import { PropertyMapLoader } from "@/components/map/PropertyMapLoader";
import type { MapMarker } from "@/components/map/types";
import { GREECE_MAP_VIEW } from "@/lib/search-map-viewport";
import { cn } from "@/lib/utils";

type Props = {
  markers?: MapMarker[];
  className?: string;
  height?: string;
  ariaLabel?: string;
};

/**
 * Always-real Midora map for /free-stays.
 * Zero markers → Greece default viewport, no fake pins.
 */
export function FreeStaysMapPanel({
  markers = [],
  className,
  height = "360px",
  ariaLabel,
}: Props) {
  const fit = markers.length > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border border-charcoal/8 bg-sand/40",
        className
      )}
      aria-label={ariaLabel}
    >
      <PropertyMapLoader
        clustered
        lat={GREECE_MAP_VIEW.center.lat}
        lng={GREECE_MAP_VIEW.center.lng}
        zoom={GREECE_MAP_VIEW.zoom}
        markers={markers}
        height={height}
        fitMarkersOnLoad={fit}
        fitMaxZoom={12}
        fitMinZoom={6}
        flush
        scrollZoomMode="cooperative"
      />
    </div>
  );
}
