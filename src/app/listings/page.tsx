import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SearchPageFooter } from "@/components/listings/SearchPageFooter";
import {
  ListingsFilters,
  type ListingsFilterValues,
} from "@/components/listings/ListingsFilters";
import { ListingsSearchView } from "@/components/listings/ListingsSearchView";
import { ListingsScrollToTop } from "@/components/listings/ListingsScrollToTop";
import { SearchResultsSkeleton } from "@/components/listings/SearchResultsSkeleton";
import { parseListingFiltersWithMessages } from "@/lib/listing-filters";
import { parseListingsPage } from "@/lib/listings-pagination";
import { parseResultSeed } from "@/lib/listings-result-seed";
import { getSearchSession } from "@/lib/search-session";
import { getFavoriteListingIds } from "@/lib/user-features";
import { resolveLocation } from "@/lib/locations/search-server";
import { resolveSearchMapViewport } from "@/lib/search-map-viewport";
import { computePriceHistogram } from "@/lib/listing-price-histogram";
import { parsePublicRentalType } from "@/lib/rental-types";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { parseSearchDurationMonths } from "@/lib/listing-search-links";
import { getMatchingFreeHostingListingIds } from "@/lib/free-hosting";
import type { ListingWithImages } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return {
    title: t("listingsTitle"),
    description: t("listingsDescription"),
  };
}

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

const GREECE_MAP_DEFAULT = {
  center: { lat: 39.1, lng: 22.4 },
  zoom: 6,
  initialBounds: undefined,
  fitToMarkers: false,
  fitMaxZoom: 8,
  fitMinZoom: 6,
} as const;

function buildFilterDefaults(
  params: Record<string, string | undefined>
): ListingsFilterValues {
  return {
    city: params.city ? decodeURIComponent(params.city) : undefined,
    area: params.area ? decodeURIComponent(params.area) : undefined,
    district: params.district ? decodeURIComponent(params.district) : undefined,
    nearby: params.nearby,
    bounds: params.bounds,
    autoMap: params.autoMap,
    polygon: params.polygon,
    rentalType: params.rentalType ?? "short_term",
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
    amenities: params.amenities,
    sort: params.sort ?? "recommended",
    freeHosting:
      params.freeHosting === "true" || params.freeHosting === "1" ? "true" : undefined,
  };
}

function markersAsMapListings(
  markers: { id: string; lat: number; lng: number }[]
): ListingWithImages[] {
  return markers.map((m) => ({
    id: m.id,
    latitude: m.lat,
    longitude: m.lng,
  })) as ListingWithImages[];
}

/** Deduped per-request session load — shared by filters + results Suspense lanes. */
const loadListingsSearchData = cache(
  async (params: Record<string, string | undefined>) => {
    const { filters: parsedFilters, dateMessages } = parseListingFiltersWithMessages(params);
    let filters = parsedFilters;

    if (filters.freeHosting && filters.rentalType === "short_term") {
      const freeHostingListingIds = await getMatchingFreeHostingListingIds({
        interestFrom: filters.interestFrom,
        interestTo: filters.interestTo,
        guests: filters.guests,
      });
      filters = {
        ...filters,
        freeHostingListingIds,
        skipMinimumStayFilter: true,
      };
    }

    const rawCity = params.city ? decodeURIComponent(params.city) : undefined;
    const resolved = rawCity ? resolveLocation(rawCity) : null;
    const seed = parseResultSeed(params.rs);
    const page = parseListingsPage(params.page);
    const guestsRaw = params.guests ? parseInt(params.guests, 10) : undefined;
    const guests =
      guestsRaw != null && Number.isFinite(guestsRaw) && guestsRaw > 0
        ? guestsRaw
        : undefined;

    let session: Awaited<ReturnType<typeof getSearchSession>> | null = null;
    let favoriteIds: string[] = [];
    let emptyDueToMinStay = false;
    let loadFailed = false;

    try {
      const [sessionResult, favoritesResult] = await Promise.allSettled([
        getSearchSession({
          filters,
          seed,
          page,
          priceContext: {
            interestFrom: filters.interestFrom,
            interestTo: filters.interestTo,
            durationMonths: parseSearchDurationMonths(params.durationMonths),
            rentalTypeFilter: filters.rentalType,
            guests,
          },
        }),
        getFavoriteListingIds(),
      ]);

      if (sessionResult.status === "fulfilled") {
        session = sessionResult.value;
      } else {
        loadFailed = true;
        console.error("[listings] session load failed:", sessionResult.reason);
      }

      if (favoritesResult.status === "fulfilled") {
        favoriteIds = favoritesResult.value;
      }

      if (
        session &&
        session.totalCount === 0 &&
        filters.rentalType === "short_term" &&
        filters.interestFrom &&
        filters.interestTo
      ) {
        const withoutMinStay = await getSearchSession({
          filters: { ...filters, skipMinimumStayFilter: true },
          seed,
          page: 1,
        });
        emptyDueToMinStay = withoutMinStay.totalCount > 0;
      }
    } catch (error) {
      loadFailed = true;
      console.error("[listings] page load failed:", error);
    }

    let unavailablePeriodsByListingId: Record<
      string,
      { start_date: string; end_date: string }[]
    > = {};
    if (!loadFailed && session && session.pageListings.length > 0) {
      try {
        const periodsMap = await getUnavailablePeriodsByListingIds(
          session.pageListings.map((l) => l.id)
        );
        unavailablePeriodsByListingId = Object.fromEntries(periodsMap.entries());
      } catch (error) {
        console.error("[listings] periods load failed:", error);
      }
    }

    if (DEV_SEARCH_LOG) {
      console.info(
        "[search] total:",
        session?.totalCount ?? 0,
        "window:",
        session?.windowCount ?? 0,
        "page:",
        session?.pageListings.length ?? 0,
        loadFailed ? "(failed)" : ""
      );
    }

    return {
      filters,
      dateMessages,
      resolved,
      session,
      favoriteIds,
      emptyDueToMinStay,
      loadFailed,
      unavailablePeriodsByListingId,
    };
  }
);

async function ListingsFiltersLane({
  params,
  defaults,
}: {
  params: Record<string, string | undefined>;
  defaults: ListingsFilterValues;
}) {
  const data = await loadListingsSearchData(params);
  const priceHistogram = computePriceHistogram(
    data.session?.pageListings ?? [],
    data.filters.rentalType ?? params.rentalType
  );

  return (
    <ListingsFilters
      defaults={defaults}
      totalCount={data.session?.totalCount ?? 0}
      priceHistogram={priceHistogram}
    />
  );
}

async function ListingsResultsLane({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const tListings = await getTranslations("Listings");
  const data = await loadListingsSearchData(params);
  const filterDefaults = buildFilterDefaults(params);
  const session = data.session;

  const mapContext = {
    polygon: data.filters.polygon,
    nearby: data.filters.nearby,
    bounds: data.filters.bounds,
    city: data.filters.city,
    area: data.filters.area,
    district: data.filters.district,
    resolvedLocation: data.resolved,
  };

  const mapViewport = data.loadFailed || !session
    ? GREECE_MAP_DEFAULT
    : resolveSearchMapViewport(
        mapContext,
        markersAsMapListings(session.markers)
      );

  const cityLabel =
    data.filters.polygon?.length || data.filters.bounds || data.filters.nearby
      ? undefined
      : data.filters.area
        ? `${data.filters.area}${data.filters.city ? ` (${data.filters.city})` : ""}`
        : filterDefaults.city;

  return (
    <>
      {data.loadFailed && (
        <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
          {tListings("loadFailedBanner")}{" "}
          <a href="/listings?rentalType=short_term" className="font-semibold underline">
            {tListings("refreshPage")}
          </a>
          .
        </div>
      )}

      {data.dateMessages.length > 0 && (
        <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
          {data.dateMessages[0]}
        </div>
      )}

      <ListingsSearchView
        pageListings={session?.pageListings ?? []}
        mapMarkers={session?.markers ?? []}
        totalCount={session?.totalCount ?? 0}
        windowCount={session?.windowCount ?? 0}
        totalPages={session?.totalPages ?? 1}
        currentPage={session?.currentPage ?? 1}
        rangeStart={session?.rangeStart ?? 0}
        rangeEnd={session?.rangeEnd ?? 0}
        emptyDueToMinStay={data.emptyDueToMinStay}
        cityLabel={cityLabel}
        districtLabel={data.filters.district}
        nearbySearch={Boolean(data.filters.nearby)}
        mapAreaSearch={Boolean(data.filters.polygon?.length)}
        searchPolygon={data.filters.polygon}
        mapCenter={mapViewport.center}
        mapZoom={mapViewport.zoom}
        mapInitialBounds={mapViewport.initialBounds}
        fitMapToMarkers={mapViewport.fitToMarkers}
        fitMapMaxZoom={mapViewport.fitMaxZoom}
        fitMapMinZoom={mapViewport.fitMinZoom}
        favoriteIds={data.favoriteIds}
        unavailablePeriodsByListingId={data.unavailablePeriodsByListingId}
      />
    </>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const rentalType = parsePublicRentalType(params.rentalType);
  if (!rentalType) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "rentalType") continue;
      if (value == null || value === "") continue;
      next.set(key, value);
    }
    next.set("rentalType", "short_term");
    redirect(`/listings?${next.toString()}`);
  }

  const filterDefaults = buildFilterDefaults(params);

  return (
    <div className="midora-msearch-shell midora-msearch-shell--listings">
      <Suspense fallback={null}>
        <ListingsScrollToTop />
      </Suspense>
      <main className="listings-page bg-white">
        <Suspense fallback={<FiltersSkeleton />}>
          <ListingsFiltersLane params={params} defaults={filterDefaults} />
        </Suspense>
        <Suspense fallback={<SearchResultsSkeleton />}>
          <ListingsResultsLane params={params} />
        </Suspense>
      </main>
      <SearchPageFooter />
    </div>
  );
}
