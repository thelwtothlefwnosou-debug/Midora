import type { MapMarker } from "@/components/map/types";
import type { ListingWithImages } from "@/lib/types";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import {
  approximateListingMapCenter,
  getListingMapCenter,
  listingHasSearchMapCoordinates,
} from "@/lib/listing-map";
import {
  getKnownCityCoords,
  getKnownSuburbCoords,
} from "@/lib/geocoding/city-centers";
import {
  resolveListingSearchPrice,
  type ListingSearchPriceContext,
} from "@/lib/listing-search-links";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMarkerPopupHtml(marker: MapMarker): string {
  const areaLine = [marker.area, marker.city].filter(Boolean).join(", ");
  const priceLabel = marker.priceLabel ?? "€";
  const priceUnit = marker.priceUnit ?? "";
  const href = marker.href ?? "#";

  return `
    <div class="midora-map-popup">
      ${
        marker.coverUrl
          ? `<img src="${escapeHtml(marker.coverUrl)}" alt="" class="midora-map-popup__img" loading="lazy" />`
          : ""
      }
      <p class="midora-map-popup__title">${escapeHtml(marker.title)}</p>
      <p class="midora-map-popup__area">${escapeHtml(areaLine)}</p>
      <p class="midora-map-popup__price">${escapeHtml(priceLabel)}${priceUnit ? ` <span>${escapeHtml(priceUnit)}</span>` : ""}</p>
      <a href="${escapeHtml(href)}" class="midora-map-popup__cta">Δες αγγελία</a>
    </div>
  `;
}

export type BuildMapMarkersOptions = {
  /** Used when a listing has no lat/lng (city search map center). */
  fallbackCenter?: { lat: number; lng: number } | null;
};

function resolveListingMarkerCenter(
  listing: ListingWithImages,
  fallbackCenter?: { lat: number; lng: number } | null
): { lat: number; lng: number } | null {
  if (listingHasSearchMapCoordinates(listing)) {
    return getListingMapCenter(
      listing.id,
      listing.latitude!,
      listing.longitude!,
      listing.location_confirmed_by_owner
    );
  }

  const suburb =
    listing.area?.trim() && listing.city?.trim()
      ? getKnownSuburbCoords(listing.area, listing.city)
      : null;
  const city = listing.city?.trim() ? getKnownCityCoords(listing.city) : null;
  const base = suburb ?? city ?? fallbackCenter ?? null;
  if (!base) return null;

  // Stable per-listing offset so multiple no-coord cards don't stack on one pixel.
  return approximateListingMapCenter(listing.id, base.lat, base.lng);
}

/** One map marker per listing — includes city/area fallback when lat/lng missing. */
export function buildMapMarkersFromListings(
  listings: ListingWithImages[],
  rentalTypeFilter?: string | null,
  getHref?: (listing: ListingWithImages) => string,
  priceContext?: ListingSearchPriceContext,
  options?: BuildMapMarkersOptions
): MapMarker[] {
  const context: ListingSearchPriceContext = {
    ...priceContext,
    rentalTypeFilter: priceContext?.rentalTypeFilter ?? rentalTypeFilter,
  };

  const markers: MapMarker[] = [];

  for (const listing of listings) {
    const mapCenter = resolveListingMarkerCenter(listing, options?.fallbackCenter);
    if (!mapCenter) continue;

    const resolved = resolveListingSearchPrice(listing, context);
    const coverUrl = pickListingCoverPhotoUrl(listing);
    const href = getHref?.(listing) ?? `/listings/${listing.slug ?? listing.id}`;

    markers.push({
      id: listing.id,
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      title: listing.title,
      price: resolved.sortAmount,
      priceLabel: resolved.priceLabel,
      priceUnit: resolved.priceUnit,
      area: listing.area,
      city: listing.city,
      coverUrl,
      href,
    });
  }

  return markers;
}
