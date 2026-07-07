import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import {
  ListingsFilters,
  type ListingsFilterValues,
} from "@/components/listings/ListingsFilters";
import { ListingsSearchView } from "@/components/listings/ListingsSearchView";
import { getSearchCatalogListings } from "@/lib/listings";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { parseListingFiltersWithMessages } from "@/lib/listing-filters";
import { LISTINGS_SEARCH_MAX } from "@/lib/listings-pagination";
import { getFavoriteListingIds } from "@/lib/user-features";
import { resolveLocation } from "@/lib/locations/search-server";
import { resolveSearchMapViewport } from "@/lib/search-map-viewport";
import { filterListingsByMapBounds } from "@/lib/listing-map-bounds";
import { computePriceHistogram } from "@/lib/listing-price-histogram";

export const metadata: Metadata = {
  title: "Αναζήτηση ακινήτων",
  description:
    "Αναζήτηση αγγελιών για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη μίσθωση στην Ελλάδα — φίλτρα, χάρτης και διαθεσιμότητα.",
};

export const revalidate = 60;

function FiltersSkeleton() {
  return (
    <header className="listings-search-header fixed top-0 right-0 left-0 z-[100] border-b border-charcoal/8 bg-white">
      <div className="listings-search-header__nav mx-auto flex h-[4.25rem] max-w-[1600px] items-center px-4 lg:px-[18px]">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-sand/60" />
      </div>
      <div className="listings-search-header__search px-4 pb-4 pt-1 lg:px-[18px]">
        <div className="h-20 animate-pulse rounded-[17px] bg-sand/50" />
      </div>
    </header>
  );
}

const DEV_SEARCH_LOG = process.env.NODE_ENV === "development";

function unavailablePeriodsRecord(
  map: Map<string, { start_date: string; end_date: string }[]>
): Record<string, { start_date: string; end_date: string }[]> {
  return Object.fromEntries(map.entries());
}

const GREECE_MAP_DEFAULT = {
  center: { lat: 39.1, lng: 22.4 },
  zoom: 6,
  initialBounds: undefined,
  fitToMarkers: false,
  fitMaxZoom: 8,
  fitMinZoom: 6,
} as const;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters, dateMessages } = parseListingFiltersWithMessages(params);

  const rawCity = params.city ? decodeURIComponent(params.city) : undefined;
  const resolved = rawCity ? resolveLocation(rawCity) : null;

  let catalogListings: Awaited<ReturnType<typeof getSearchCatalogListings>> = [];
  let favoriteIds: string[] = [];
  let unavailablePeriodsByListingId: Record<
    string,
    { start_date: string; end_date: string }[]
  > = {};
  let emptyDueToMinStay = false;
  let loadFailed = false;

  try {
    const catalogFilters = { ...filters, bounds: undefined };

    const [listingsResult, favoritesResult] = await Promise.allSettled([
      getSearchCatalogListings(catalogFilters, LISTINGS_SEARCH_MAX),
      getFavoriteListingIds(),
    ]);

    if (listingsResult.status === "fulfilled") {
      catalogListings = listingsResult.value;
    } else {
      loadFailed = true;
      console.error("[listings] catalog load failed:", listingsResult.reason);
    }

    if (favoritesResult.status === "fulfilled") {
      favoriteIds = favoritesResult.value;
    }

    if (!loadFailed && catalogListings.length > 0) {
      const periodsMap = await getUnavailablePeriodsByListingIds(
        catalogListings.map((l) => l.id)
      );
      unavailablePeriodsByListingId = unavailablePeriodsRecord(periodsMap);
    }

    if (
      !loadFailed &&
      filters.bounds &&
      catalogListings.length > 0 &&
      filterListingsByMapBounds(catalogListings, filters.bounds).length === 0 &&
      filters.rentalType === "short_term" &&
      filters.interestFrom &&
      filters.interestTo
    ) {
      const withoutMinStay = await getSearchCatalogListings(
        { ...catalogFilters, skipMinimumStayFilter: true },
        LISTINGS_SEARCH_MAX
      );
      emptyDueToMinStay =
        filterListingsByMapBounds(withoutMinStay, filters.bounds).length > 0;
    } else if (
      !loadFailed &&
      catalogListings.length === 0 &&
      filters.rentalType === "short_term" &&
      filters.interestFrom &&
      filters.interestTo
    ) {
      const withoutMinStay = await getSearchCatalogListings(
        { ...catalogFilters, skipMinimumStayFilter: true },
        LISTINGS_SEARCH_MAX
      );
      emptyDueToMinStay = withoutMinStay.length > 0;
    }
  } catch (error) {
    loadFailed = true;
    console.error("[listings] page load failed:", error);
  }

  if (DEV_SEARCH_LOG) {
    console.info("[search] catalog:", catalogListings.length, loadFailed ? "(failed)" : "");
  }

  const mapContext = {
    polygon: filters.polygon,
    nearby: filters.nearby,
    bounds: filters.bounds,
    city: filters.city,
    area: filters.area,
    district: filters.district,
    resolvedLocation: resolved,
  };

  const mapDisplayListings = filters.bounds
    ? filterListingsByMapBounds(catalogListings, filters.bounds)
    : catalogListings;

  const mapViewport = loadFailed
    ? GREECE_MAP_DEFAULT
    : resolveSearchMapViewport(mapContext, mapDisplayListings);

  const filterDefaults: ListingsFilterValues = {
    city: params.city ? decodeURIComponent(params.city) : undefined,
    area: params.area ? decodeURIComponent(params.area) : undefined,
    district: params.district ? decodeURIComponent(params.district) : undefined,
    nearby: params.nearby,
    bounds: params.bounds,
    autoMap: params.autoMap,
    polygon: params.polygon,
    rentalType: params.rentalType,
    interestFrom: params.start ?? params.interestFrom,
    interestTo: params.end ?? params.interestTo,
    startMonth: params.startMonth,
    durationMonths: params.durationMonths,
    availableFrom: params.availableFrom,
    minDuration: params.minDuration,
    guests: params.guests,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minPriceNight: params.minPriceNight,
    maxPriceNight: params.maxPriceNight,
    minMonthly: params.minMonthly,
    maxMonthly: params.maxMonthly,
    type: params.type,
    furnished: params.furnished,
    bills: params.bills,
    minMonths: params.minMonths,
    moveIn: params.moveIn,
    minSqm: params.minSqm,
    parking: params.parking,
    pets: params.pets,
    heating: params.heating,
    sort: params.sort ?? "recommended",
  };

  const cityLabel =
    filters.polygon?.length || filters.bounds || filters.nearby
      ? undefined
      : filters.area
        ? `${filters.area}${filters.city ? ` (${filters.city})` : ""}`
        : filterDefaults.city;

  const districtLabel = filters.district;
  const mapAreaSearch = Boolean(filters.polygon?.length);
  const nearbySearch = Boolean(filters.nearby);

  const priceHistogram = computePriceHistogram(
    catalogListings,
    filters.rentalType ?? params.rentalType
  );

  return (
    <>
      <main className="listings-page bg-white lg:flex lg:h-[100dvh] lg:flex-col lg:overflow-hidden">
        <Suspense fallback={<FiltersSkeleton />}>
          <ListingsFilters
            defaults={filterDefaults}
            totalCount={catalogListings.length}
            priceHistogram={priceHistogram}
          />
        </Suspense>

        {loadFailed && (
          <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
            Δεν ήταν δυνατή η φόρτωση των αγγελιών. Δοκίμασε ξανά σε λίγα δευτερόλεπτα ή{" "}
            <a href="/listings" className="font-semibold underline">
              ανανέωσε τη σελίδα
            </a>
            .
          </div>
        )}

        {dateMessages.length > 0 && (
          <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
            {dateMessages[0]}
          </div>
        )}

        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
          <ListingsSearchView
            catalogListings={catalogListings}
            emptyDueToMinStay={emptyDueToMinStay}
            cityLabel={cityLabel}
            districtLabel={districtLabel}
            nearbySearch={nearbySearch}
            mapAreaSearch={mapAreaSearch}
            searchPolygon={filters.polygon}
            mapCenter={mapViewport.center}
            mapZoom={mapViewport.zoom}
            mapInitialBounds={mapViewport.initialBounds}
            fitMapToMarkers={mapViewport.fitToMarkers}
            fitMapMaxZoom={mapViewport.fitMaxZoom}
            fitMapMinZoom={mapViewport.fitMinZoom}
            favoriteIds={favoriteIds}
            unavailablePeriodsByListingId={unavailablePeriodsByListingId}
          />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
