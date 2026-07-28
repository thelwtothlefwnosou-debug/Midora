"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { MapMarker } from "@/components/map/types";
import { cn } from "@/lib/utils";

type Props = {
  marker: MapMarker;
  className?: string;
  compact?: boolean;
};

export function ListingMapPreview({ marker, className, compact = true }: Props) {
  const t = useTranslations("Common");
  const areaLine = [marker.area, marker.city].filter(Boolean).join(", ");
  const href = marker.href ?? `/listings/${marker.id}`;

  return (
    <div
      className={cn("midora-map-popup", compact && "midora-map-popup--compact", className)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {marker.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={marker.coverUrl}
          alt=""
          className="midora-map-popup__img"
          loading="lazy"
        />
      ) : null}
      <p className="midora-map-popup__title">{marker.title}</p>
      {areaLine ? <p className="midora-map-popup__area">{areaLine}</p> : null}
      <p className="midora-map-popup__price">
        {marker.priceLabel ?? "€"}
        {marker.priceUnit ? <span>{marker.priceUnit}</span> : null}
      </p>
      <Link href={href} className="midora-map-popup__cta">
        {t("viewListing")}
      </Link>
    </div>
  );
}
