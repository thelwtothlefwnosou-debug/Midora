import type { MapMarker } from "@/components/map/types";

import type { ListingWithImages } from "@/lib/types";

import { pickListingCoverPhotoUrl } from "@/lib/listing-media";

import { getListingMapCenter } from "@/lib/listing-map";

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



export function buildMapMarkersFromListings(

  listings: ListingWithImages[],

  rentalTypeFilter?: string | null,

  getHref?: (listing: ListingWithImages) => string,

  priceContext?: ListingSearchPriceContext

): MapMarker[] {

  const context: ListingSearchPriceContext = {

    ...priceContext,

    rentalTypeFilter: priceContext?.rentalTypeFilter ?? rentalTypeFilter,

  };



  return listings

    .filter(

      (l) =>

        l.latitude != null &&

        l.longitude != null &&

        Number.isFinite(l.latitude) &&

        Number.isFinite(l.longitude)

    )

    .map((listing) => {

      const resolved = resolveListingSearchPrice(listing, context);

      const coverUrl = pickListingCoverPhotoUrl(listing);

      const href = getHref?.(listing) ?? `/listings/${listing.slug ?? listing.id}`;

      const mapCenter = getListingMapCenter(
        listing.id,
        listing.latitude!,
        listing.longitude!,
        listing.location_confirmed_by_owner
      );



      return {

        id: listing.id,

        lat: mapCenter.lat,

        lng: mapCenter.lng,

        title: listing.title,

        price: resolved.sortAmount,

        priceLabel: resolved.priceLabel,

        priceUnit: resolved.isStayTotal ? resolved.priceUnit : resolved.priceUnit,

        area: listing.area,

        city: listing.city,

        coverUrl,

        href,

      };

    });

}

