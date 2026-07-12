import "server-only";

import type { ListingFilters, ListingWithImages } from "@/lib/types";
import { matchesLocation, resolveCityQuery } from "@/lib/data/locations-server";
import { normalizeLocationQuery } from "@/lib/locations/normalize";
import { citiesMatchNormalized } from "@/lib/locations/search-server";
import { getAreasForDistrict } from "@/lib/data/greek-areas";
import { isPointInPolygon, parsePolygonParam } from "@/lib/geo/polygon";
import { haversineMeters } from "@/lib/geo/polygon";
import { isListingAvailableForStay } from "@/lib/availability";
import {
  durationRangeToMaxListingMinMonths,
  parseSearchDurationParam,
} from "@/lib/duration-ranges";
import { parsePublicRentalType, isPublicMvpListing, listingMatchesRentalTypeFilter } from "@/lib/rental-types";
import { sanitizeSearchDateFilters } from "@/lib/search-date-validation";
import { resolveLocation } from "@/lib/locations/search-server";
import { estimateBathrooms } from "@/lib/listing-filter-helpers";
import { resolveMinimumStayNights } from "@/lib/listing-rental-modes";
import { stayNightsBetween } from "@/lib/availability-calendar";
import { parseAmenityFilterParam } from "@/lib/search-amenity-filters";
import { isSearchQualityListing } from "@/lib/search-listing-quality";

function normalize(s: string) {
  return normalizeLocationQuery(s);
}

function listingInBounds(
  listing: ListingWithImages,
  bounds: NonNullable<ListingFilters["bounds"]>
): boolean {
  if (listing.latitude == null || listing.longitude == null) return false;
  const { lat, lng } = { lat: listing.latitude, lng: listing.longitude };
  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  );
}

export function applyListingFilters(
  listings: ListingWithImages[],
  filters: ListingFilters
): ListingWithImages[] {
  let results = listings.filter(isPublicMvpListing);

  if (filters.polygon?.length) {
    results = results.filter(
      (l) =>
        l.latitude != null &&
        l.longitude != null &&
        isPointInPolygon(
          { lat: l.latitude, lng: l.longitude },
          filters.polygon!
        )
    );
  } else if (filters.bounds) {
    results = results.filter((l) => listingInBounds(l, filters.bounds!));
  } else if (filters.nearby) {
    const radiusM = (filters.nearby.radiusKm ?? 8) * 1000;
    results = results.filter((l) => {
      if (l.latitude == null || l.longitude == null) return false;
      return (
        haversineMeters(
          { lat: l.latitude, lng: l.longitude },
          filters.nearby!
        ) <= radiusM
      );
    });
  } else if (filters.district && filters.city) {
    const areas = getAreasForDistrict(filters.city, filters.district);
    results = results.filter((l) => {
      if (!citiesMatchNormalized(l.city, filters.city!)) return false;
      if (areas.length === 0) {
        return normalize(l.area).includes(normalize(filters.district!));
      }
      return areas.some((a) => normalize(l.area) === normalize(a));
    });
  } else if (filters.area && filters.city) {
    results = results.filter(
      (l) =>
        citiesMatchNormalized(l.city, filters.city!) &&
        normalize(l.area).includes(normalize(filters.area!))
    );
  } else if (filters.city?.trim()) {
    const resolved = resolveCityQuery(filters.city);
    results = results.filter((l) =>
      matchesLocation(l.city, l.area, resolved, filters.district)
    );
  }

  if (filters.minPrice || filters.maxPrice || filters.minPriceNight || filters.maxPriceNight || filters.minMonthly || filters.maxMonthly) {
    const isShort = filters.rentalType === "short_term";
    const min = isShort
      ? (filters.minPriceNight ?? filters.minPrice)
      : (filters.minMonthly ?? filters.minPrice);
    const max = isShort
      ? (filters.maxPriceNight ?? filters.maxPrice)
      : (filters.maxMonthly ?? filters.maxPrice);

    if (min != null) {
      results = results.filter((l) => {
        const amount = isShort
          ? (l.price_per_night ?? l.price_monthly)
          : l.price_monthly;
        return amount >= min;
      });
    }
    if (max != null) {
      results = results.filter((l) => {
        const amount = isShort
          ? (l.price_per_night ?? l.price_monthly)
          : l.price_monthly;
        return amount <= max;
      });
    }
  }
  if (filters.minBedrooms) {
    results = results.filter((l) => l.bedrooms >= filters.minBedrooms!);
  }
  if (filters.minBathrooms) {
    results = results.filter(
      (l) => (l.bathrooms ?? estimateBathrooms(l.bedrooms)) >= filters.minBathrooms!
    );
  }
  if (filters.furnished !== undefined) {
    results = results.filter((l) => l.furnished === filters.furnished);
  }
  if (filters.utilitiesIncluded !== undefined) {
    results = results.filter(
      (l) => l.utilities_included === filters.utilitiesIncluded
    );
  }
  if (filters.minMonths) {
    results = results.filter((l) => l.min_months <= filters.minMonths!);
  }
  if (filters.moveIn && filters.minMonths) {
    results = results.filter((l) =>
      isListingAvailableForStay(l, filters.moveIn!, filters.minMonths!)
    );
  } else if (filters.moveIn) {
    results = results.filter((l) =>
      isListingAvailableForStay(l, filters.moveIn!, l.min_months)
    );
  }
  if (filters.rentalType) {
    const rt = filters.rentalType;
    if (rt === "short_term" || rt === "monthly") {
      results = results.filter((l) => listingMatchesRentalTypeFilter(l, rt));
    }
  }
  if (filters.propertyType) {
    results = results.filter((l) => l.property_type === filters.propertyType);
  }
  if (filters.minSqm) {
    results = results.filter((l) => (l.sqm ?? 0) >= filters.minSqm!);
  }
  if (filters.hasParking) {
    results = results.filter((l) => l.has_parking);
  }
  if (filters.petsAllowed) {
    results = results.filter((l) => l.pets_allowed);
  }
  if (filters.hasHeating) {
    results = results.filter((l) => Boolean(l.heating_type?.trim()));
  }
  if (filters.guests) {
    results = results.filter(
      (l) => (l.max_guests ?? 99) >= filters.guests!
    );
  }

  if (
    !filters.skipMinimumStayFilter &&
    filters.rentalType === "short_term" &&
    filters.interestFrom &&
    filters.interestTo
  ) {
    const nights = stayNightsBetween(filters.interestFrom, filters.interestTo);
    results = results.filter(
      (l) => resolveMinimumStayNights(l) <= nights
    );
  }

  return results.filter(isSearchQualityListing);
}

function isBoosted(listing: ListingWithImages): boolean {
  if (!listing.search_boost_until) return false;
  return new Date(listing.search_boost_until) > new Date();
}

function amenityScore(listing: ListingWithImages): number {
  let score = 0;
  if (listing.furnished) score += 1;
  if (listing.has_parking) score += 1;
  if (listing.pets_allowed) score += 1;
  if (listing.has_elevator) score += 1;
  if (listing.utilities_included) score += 1;
  if (listing.heating_type?.trim()) score += 1;
  return score;
}

export function sortListings(
  listings: ListingWithImages[],
  sort: ListingFilters["sort"] = "recommended"
): ListingWithImages[] {
  const compareBoost = (a: ListingWithImages, b: ListingWithImages) =>
    (isBoosted(b) ? 1 : 0) - (isBoosted(a) ? 1 : 0);

  const copy = [...listings];

  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => {
        const boost = compareBoost(a, b);
        if (boost !== 0) return boost;
        const pa = a.price_per_night ?? a.price_monthly;
        const pb = b.price_per_night ?? b.price_monthly;
        return pa - pb;
      });
    case "price_desc":
      return copy.sort((a, b) => {
        const boost = compareBoost(a, b);
        if (boost !== 0) return boost;
        const pa = a.price_per_night ?? a.price_monthly;
        const pb = b.price_per_night ?? b.price_monthly;
        return pb - pa;
      });
    case "bedrooms_desc":
      return copy.sort((a, b) => {
        const boost = compareBoost(a, b);
        if (boost !== 0) return boost;
        return b.bedrooms - a.bedrooms;
      });
    case "amenities_desc":
      return copy.sort((a, b) => {
        const boost = compareBoost(a, b);
        if (boost !== 0) return boost;
        return amenityScore(b) - amenityScore(a);
      });
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "recommended":
    default:
      return copy.sort((a, b) => {
        const boost = compareBoost(a, b);
        if (boost !== 0) return boost;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }
}

function parseBoundsParam(raw: string | undefined): ListingFilters["bounds"] {
  if (!raw?.trim()) return undefined;
  const [north, south, east, west] = raw.split(",").map(parseFloat);
  if ([north, south, east, west].some((n) => !Number.isFinite(n))) return undefined;
  return { north, south, east, west };
}

function parseNearbyParam(raw: string | undefined): ListingFilters["nearby"] {
  if (!raw?.trim()) return undefined;
  const [lat, lng, radius] = raw.split(",").map(parseFloat);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return {
    lat,
    lng,
    radiusKm: Number.isFinite(radius) ? radius : 8,
  };
}

function applyStayIntent(
  params: Record<string, string | undefined>,
  filters: ListingFilters
): ListingFilters {
  const stay = params.stay?.trim();
  if (!stay) return filters;

  switch (stay) {
    case "students":
      return {
        ...filters,
        maxPrice: filters.maxPrice ?? 600,
        minMonths: filters.minMonths ?? 1,
        furnished: filters.furnished ?? true,
      };
    case "remote":
      return {
        ...filters,
        minMonths: filters.minMonths ?? 3,
        furnished: filters.furnished ?? true,
      };
    case "relocation":
    case "business":
    case "project":
    case "substitutes":
    case "seasonal":
      return {
        ...filters,
        minMonths: filters.minMonths ?? 1,
        furnished: filters.furnished ?? true,
      };
    case "teams":
      return {
        ...filters,
        minBedrooms: filters.minBedrooms ?? 2,
        minMonths: filters.minMonths ?? 1,
      };
    default:
      return filters;
  }
}

export function parseListingFilters(
  params: Record<string, string | undefined>
): ListingFilters {
  const { filters } = parseListingFiltersWithMessages(params);
  return filters;
}

export function parseListingFiltersWithMessages(
  params: Record<string, string | undefined>
): { filters: ListingFilters; dateMessages: string[] } {
  const built = buildListingFilters(params);
  const { filters, messages } = sanitizeSearchDateFilters(built);
  return { filters: applyStayIntent(params, filters), dateMessages: messages };
}

function buildListingFilters(
  params: Record<string, string | undefined>
): ListingFilters {
  const polygon = parsePolygonParam(params.polygon);
  const bounds = parseBoundsParam(params.bounds);
  const nearby = parseNearbyParam(params.nearby);
  const duration = parseSearchDurationParam(params.duration);
  const legacyMinMonths = params.minMonths
    ? parseInt(params.minMonths, 10)
    : undefined;
  const minMonthsFromDuration = duration
    ? durationRangeToMaxListingMinMonths(duration)
    : undefined;

  const rentalType = parsePublicRentalType(params.rentalType);
  const isShort = rentalType === "short_term";

  let city = params.city ? decodeURIComponent(params.city) : undefined;
  if (city?.trim()) {
    const resolved = resolveLocation(city);
    if (resolved?.strongMatch) {
      city = resolved.city;
    }
  }

  const filters: ListingFilters = {
    city,
    area: params.area ? decodeURIComponent(params.area) : undefined,
    district: params.district ? decodeURIComponent(params.district) : undefined,
    polygon,
    bounds: polygon ? undefined : bounds,
    nearby: polygon || bounds ? undefined : nearby,
    minPriceNight: params.minPriceNight
      ? parseInt(params.minPriceNight, 10)
      : isShort && params.minPrice
        ? parseInt(params.minPrice, 10)
        : undefined,
    maxPriceNight: params.maxPriceNight
      ? parseInt(params.maxPriceNight, 10)
      : isShort && params.maxPrice
        ? parseInt(params.maxPrice, 10)
        : undefined,
    minMonthly: params.minMonthly
      ? parseInt(params.minMonthly, 10)
      : !isShort && params.minPrice
        ? parseInt(params.minPrice, 10)
        : undefined,
    maxMonthly: params.maxMonthly
      ? parseInt(params.maxMonthly, 10)
      : !isShort && params.maxPrice
        ? parseInt(params.maxPrice, 10)
        : undefined,
    minPrice: params.minPrice ? parseInt(params.minPrice, 10) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice, 10) : undefined,
    minBedrooms: params.bedrooms ? parseInt(params.bedrooms, 10) : undefined,
    minBathrooms: params.bathrooms ? parseInt(params.bathrooms, 10) : undefined,
    furnished:
      params.furnished === "true"
        ? true
        : params.furnished === "false"
          ? false
          : undefined,
    utilitiesIncluded: params.bills === "true" ? true : undefined,
    duration,
    minMonths: minMonthsFromDuration ?? legacyMinMonths,
    moveIn: params.moveIn?.trim() || undefined,
    propertyType: params.type || undefined,
    rentalType,
    interestFrom:
      params.start?.trim() || params.interestFrom?.trim() || undefined,
    interestTo: params.end?.trim() || params.interestTo?.trim() || undefined,
    interestStartMonth: params.startMonth?.trim() || params.moveIn?.trim() || undefined,
    interestDurationMonths: params.durationMonths
      ? parseInt(params.durationMonths, 10)
      : minMonthsFromDuration ?? legacyMinMonths,
    availableFrom: params.availableFrom?.trim() || undefined,
    minDurationMonths: params.minDuration
      ? parseInt(params.minDuration, 10)
      : undefined,
    guests: params.guests ? parseInt(params.guests, 10) : undefined,
    minSqm: params.minSqm ? parseInt(params.minSqm, 10) : undefined,
    hasParking: params.parking === "true" ? true : undefined,
    petsAllowed: params.pets === "true" ? true : undefined,
    cleaningIncluded: params.cleaning === "true" ? true : undefined,
    hasHeating: params.heating === "true" ? true : undefined,
    amenityKeys: parseAmenityFilterParam(params.amenities),
    sort: (params.sort as ListingFilters["sort"]) || "recommended",
  };

  return filters;
}

export function isEmptyDueToMinimumStay(
  listings: ListingWithImages[],
  filters: ListingFilters
): boolean {
  if (
    filters.rentalType !== "short_term" ||
    !filters.interestFrom ||
    !filters.interestTo
  ) {
    return false;
  }
  const withMinStaySkipped = applyListingFilters(listings, {
    ...filters,
    skipMinimumStayFilter: true,
  });
  const withMinStay = applyListingFilters(listings, filters);
  return withMinStaySkipped.length > 0 && withMinStay.length === 0;
}

export { estimateBathrooms, propertyTypeLabel } from "@/lib/listing-filter-helpers";
