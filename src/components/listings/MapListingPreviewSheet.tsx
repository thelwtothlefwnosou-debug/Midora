"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { MapMarker } from "@/components/map/types";
import { cn } from "@/lib/utils";

type Props = {
  marker: MapMarker | null;
  onClose: () => void;
  className?: string;
};

export function MapListingPreviewSheet({ marker, onClose, className }: Props) {
  if (!marker) return null;

  const detailHref = marker.href ?? `/listings/${marker.id}`;
  const areaLine = [marker.area, marker.city].filter(Boolean).join(", ");

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-[600] rounded-t-2xl border-t border-border bg-white p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted"
        aria-label="Κλείσιμο"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-10">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-sand/50">
          {marker.coverUrl ? (
            <Image src={marker.coverUrl} alt="" fill className="object-cover" sizes="96px" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-display text-sm font-semibold text-charcoal">
            {marker.title}
          </p>
          {areaLine && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{areaLine}</p>
          )}
          <p className="mt-1 text-sm font-semibold text-charcoal">
            {marker.priceLabel ?? "€"}
            {marker.priceUnit ? (
              <span className="text-xs font-normal text-muted"> {marker.priceUnit}</span>
            ) : null}
          </p>
        </div>
      </div>

      <Link
        href={detailHref}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-white"
      >
        Δες αγγελία
      </Link>
    </div>
  );
}
