"use client";

import { ExternalLink, MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropertyMapLoader } from "@/components/map/PropertyMapLoader";
import type { ListingPublicDetail } from "@/lib/types";
import { buildExternalMapsUrl } from "@/lib/geocoding/nominatim";
import {
  getListingMapCenter,
  listingShowsExactPublicLocation,
} from "@/lib/listing-map";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  rentalMode?: "short_term" | "monthly";
  className?: string;
};

export function ListingAreaSection({
  listing,
  rentalMode = "short_term",
  className,
}: Props) {
  const t = useTranslations("Legal.shared");
  const tArea = useTranslations("Listing.areaSection");
  const exact = listingShowsExactPublicLocation(listing);
  const hasCoords = listing.latitude != null && listing.longitude != null;
  const mapCenter = hasCoords
    ? getListingMapCenter(
        listing.id,
        listing.latitude!,
        listing.longitude!,
        listing.location_confirmed_by_owner
      )
    : null;

  const displayCity = listing.city_display_name || listing.city;
  const displayArea = listing.area_display_name || listing.area;
  const addressLine =
    listing.formatted_address ||
    [listing.address_street, listing.address_number, displayCity]
      .filter(Boolean)
      .join(", ");

  const hints = [
    listing.nearby_metro && { label: tArea("nearbyMetro"), value: listing.nearby_metro },
    listing.distance_beach && { label: tArea("distanceBeach"), value: listing.distance_beach },
    listing.distance_center && { label: tArea("distanceCenter"), value: listing.distance_center },
    listing.distance_airport && {
      label: tArea("distanceAirport"),
      value: listing.distance_airport,
    },
    listing.distance_port && { label: tArea("distancePort"), value: listing.distance_port },
  ].filter(Boolean) as { label: string; value: string }[];

  const visibilityNote = exact
    ? t("addressVisibilityPublicExact")
    : hasCoords
      ? t("addressVisibilityApproximate")
      : t("addressVisibilityAfterInquiry");

  const sectionTitle =
    rentalMode === "monthly" ? tArea("titleMonthly") : tArea("titleShortTerm");
  const mapsCta = exact ? tArea("openExactLocation") : tArea("openAreaLocation");

  return (
    <section
      id="area"
      className={cn(
        "listing-map-section listing-section scroll-mt-28 border-t border-charcoal/8",
        className
      )}
    >
      <h2 className="listing-section-title">{sectionTitle}</h2>
      <p className="listing-meta mt-3">
        {displayArea}, {displayCity}
      </p>
      {addressLine && exact ? (
        <p className="mt-2 text-sm text-charcoal/85">{addressLine}</p>
      ) : null}
      <p className="mt-2 text-sm text-muted">{visibilityNote}</p>

      {hints.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-charcoal/80">
          {hints.map((h) => (
            <li key={h.label}>
              <span className="text-muted">{h.label}:</span> {h.value}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="listing-map-frame mt-6 overflow-hidden rounded-2xl border border-charcoal/8 bg-sand/20 shadow-[0_8px_28px_-18px_rgba(26,26,26,0.35)]">
        {mapCenter && hasCoords ? (
          <PropertyMapLoader
            listingId={listing.id}
            lat={listing.latitude!}
            lng={listing.longitude!}
            title={listing.title}
            height="480px"
            exactLocation={exact}
          />
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center sm:min-h-[420px]">
            <MapPinned className="h-10 w-10 text-gold" />
            <p className="mt-4 font-medium text-charcoal">
              {displayArea}, {displayCity}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted">
              {t("addressVisibilityAfterInquiry")}
            </p>
          </div>
        )}
      </div>

      {mapCenter ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={buildExternalMapsUrl(mapCenter.lat, mapCenter.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:border-gold/30"
          >
            <ExternalLink className="h-4 w-4 text-gold-dark" aria-hidden />
            {mapsCta}
          </a>
        </div>
      ) : null}
    </section>
  );
}
