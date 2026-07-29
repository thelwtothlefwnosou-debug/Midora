"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Map as MapIcon, Search, PanelRightClose, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropertyMapLoader } from "@/components/map/PropertyMapLoader";
import type { ListingWithImages } from "@/lib/types";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { SearchListingCardGrid } from "@/components/listings/SearchListingCard";
import { ListingsSortSelect } from "@/components/listings/ListingsSortSelect";
import { ListingsPagination } from "@/components/listings/ListingsPagination";
import { MapListingPreviewSheet } from "@/components/listings/MapListingPreviewSheet";
import { appendBoundsToParams } from "@/lib/search-params";
import {
  paginateListings,
  parseListingsPage,
  resetListingsPage,
} from "@/lib/listings-pagination";
import { buildListingDetailHref, parseSearchDurationMonths } from "@/lib/listing-search-links";
import { buildMapMarkersFromListings } from "@/lib/listings-map-markers";
import { filterListingsByMapBounds } from "@/lib/listing-map-bounds";
import {
  buildResultsPageTitle,
  buildResultsSubtitle,
} from "@/lib/search-results-header";
import type { LatLng, MapBounds } from "@/lib/geo/polygon";
import type { MapViewportChangeMeta } from "@/components/map/MidoraResultsMap";
import { cn } from "@/lib/utils";

type Props = {
  catalogListings: ListingWithImages[];
  emptyDueToMinStay?: boolean;
  cityLabel?: string;
  districtLabel?: string;
  nearbySearch?: boolean;
  mapAreaSearch?: boolean;
  searchPolygon?: LatLng[];
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  mapInitialBounds?: MapBounds;
  fitMapToMarkers?: boolean;
  fitMapMaxZoom?: number;
  fitMapMinZoom?: number;
  favoriteIds?: string[];
  unavailablePeriodsByListingId?: Record<
    string,
    Pick<ListingUnavailablePeriod, "start_date" | "end_date">[]
  >;
};

function parseBounds(raw: string | null): MapBounds | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [north, south, east, west] = parts;
  return { north, south, east, west };
}

function boundsMeaningfullyChanged(a: MapBounds, b: MapBounds): boolean {
  const threshold = 0.004;
  return (
    Math.abs(a.north - b.north) > threshold ||
    Math.abs(a.south - b.south) > threshold ||
    Math.abs(a.east - b.east) > threshold ||
    Math.abs(a.west - b.west) > threshold
  );
}

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLgUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLgUp;
}

export function ListingsSearchView({
  catalogListings,
  emptyDueToMinStay = false,
  cityLabel,
  districtLabel,
  nearbySearch,
  mapAreaSearch,
  searchPolygon,
  mapCenter,
  mapZoom,
  mapInitialBounds,
  fitMapToMarkers = false,
  fitMapMaxZoom = 14,
  fitMapMinZoom = 6,
  favoriteIds = [],
  unavailablePeriodsByListingId = {},
}: Props) {
  const t = useTranslations("Listings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLgUp = useIsLgUp();
  const listingRefs = useRef(new globalThis.Map<string, HTMLDivElement>());
  const baselineBoundsRef = useRef<MapBounds | undefined>(undefined);
  const pendingBoundsRef = useRef<MapBounds | null>(null);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boundsSearch = Boolean(searchParams.get("bounds"));
  const initialBounds = parseBounds(searchParams.get("bounds")) ?? mapInitialBounds;
  const mapBoundsMode = !searchPolygon?.length;
  const rentalType = searchParams.get("rentalType");
  const durationMonths = parseSearchDurationMonths(searchParams.get("durationMonths"));
  const guestsRaw = searchParams.get("guests");
  const guests = guestsRaw ? parseInt(guestsRaw, 10) : undefined;
  const selectedGuests =
    guests != null && Number.isFinite(guests) && guests > 0 ? guests : undefined;
  const interestFrom =
    searchParams.get("interestFrom")?.trim() ||
    searchParams.get("start")?.trim() ||
    undefined;
  const interestTo =
    searchParams.get("interestTo")?.trim() ||
    searchParams.get("end")?.trim() ||
    undefined;

  const [liveBounds, setLiveBounds] = useState<MapBounds | null>(null);
  const [clientPage, setClientPage] = useState(1);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [mapOpen, setMapOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobilePreviewId, setMobilePreviewId] = useState<string | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [viewportDirty, setViewportDirty] = useState(false);
  const [mapSearchPending, setMapSearchPending] = useState(false);

  const searchKey = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    p.delete("bounds");
    return p.toString();
  }, [searchParams]);

  const visibleListings = useMemo(() => {
    if (!mapBoundsMode || !liveBounds) return catalogListings;
    return filterListingsByMapBounds(catalogListings, liveBounds);
  }, [catalogListings, liveBounds, mapBoundsMode]);

  const pagination = useMemo(
    () => paginateListings(visibleListings, clientPage),
    [visibleListings, clientPage]
  );

  const listings = pagination.items;

  const listingHrefs = useMemo(() => {
    const hrefParams = new URLSearchParams(searchKey);
    const hrefs = new Map<string, string>();
    for (const listing of visibleListings) {
      hrefs.set(listing.id, buildListingDetailHref(listing, hrefParams));
    }
    return hrefs;
  }, [visibleListings, searchKey]);

  // Map pins match the current results page (up to 18) — one pin per card.
  const mapMarkers = useMemo(() => {
    const stayParams = new URLSearchParams(searchKey);
    return buildMapMarkersFromListings(
      listings,
      rentalType,
      (listing) => buildListingDetailHref(listing, stayParams),
      {
        interestFrom,
        interestTo,
        durationMonths,
        rentalTypeFilter: rentalType,
        guests: selectedGuests,
      },
      { fallbackCenter: mapCenter }
    );
  }, [
    listings,
    rentalType,
    searchKey,
    interestFrom,
    interestTo,
    durationMonths,
    selectedGuests,
    mapCenter,
  ]);

  const { title: pageTitle } = buildResultsPageTitle(
    {
      rentalType,
      cityLabel,
      districtLabel,
      nearbySearch,
      mapAreaSearch,
      boundsSearch,
    },
    t
  );
  const pageSubtitle = buildResultsSubtitle(pagination.totalCount, t);
  const showDatesHint =
    rentalType === "short_term" && !interestFrom && !interestTo && listings.length > 0;

  const clearMarkerSelection = useCallback(() => {
    setSelectedId(null);
    setMobilePreviewId(null);
  }, []);

  useEffect(() => {
    setHoveredId(null);
    clearMarkerSelection();
  }, [searchKey, clearMarkerSelection]);

  useEffect(() => {
    if (selectedId && !mapMarkers.some((marker) => marker.id === selectedId)) {
      clearMarkerSelection();
    }
  }, [mapMarkers, selectedId, clearMarkerSelection]);

  const skipPageScrollRef = useRef(true);

  const syncBoundsToUrl = useCallback(
    (bounds: MapBounds) => {
      const params = resetListingsPage(new URLSearchParams(searchParams.toString()));
      params.delete("city");
      params.delete("area");
      params.delete("district");
      params.delete("nearby");
      params.delete("polygon");
      params.delete("autoMap");
      appendBoundsToParams(params, bounds);
      window.history.replaceState(null, "", `/listings?${params.toString()}`);
    },
    [searchParams]
  );

  const applyLiveBounds = useCallback(
    (bounds: MapBounds) => {
      setLiveBounds(bounds);
      setClientPage(1);
      baselineBoundsRef.current = bounds;
      pendingBoundsRef.current = bounds;
      setPendingBounds(bounds);
      setViewportDirty(false);
      setMapSearchPending(false);
      syncBoundsToUrl(bounds);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    },
    [syncBoundsToUrl]
  );

  useEffect(() => {
    setLiveBounds(initialBounds ?? null);
    setClientPage(parseListingsPage(searchParams.get("page") ?? undefined));
    if (initialBounds) {
      baselineBoundsRef.current = initialBounds;
    } else {
      baselineBoundsRef.current = undefined;
    }
    setViewportDirty(false);
    setPendingBounds(null);
    setMapSearchPending(false);
    setMobilePreviewId(null);
    if (autoSearchDebounceRef.current) {
      clearTimeout(autoSearchDebounceRef.current);
      autoSearchDebounceRef.current = null;
    }
  }, [searchKey, initialBounds?.north, initialBounds?.south, initialBounds?.east, initialBounds?.west]);

  useEffect(() => {
    if (skipPageScrollRef.current) {
      skipPageScrollRef.current = false;
      return;
    }
    setHoveredId(null);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [clientPage]);

  // New search / navigation into listings: always land at the top (not restored mid-page).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [searchKey]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const applyMapAreaSearch = useCallback(() => {
    const bounds = pendingBoundsRef.current ?? pendingBounds;
    if (!bounds) return;
    if (autoSearchDebounceRef.current) {
      clearTimeout(autoSearchDebounceRef.current);
      autoSearchDebounceRef.current = null;
    }
    applyLiveBounds(bounds);
  }, [pendingBounds, applyLiveBounds]);

  const handleViewportChange = useCallback(
    (bounds: MapBounds, meta?: MapViewportChangeMeta) => {
      if (!mapBoundsMode) return;
      pendingBoundsRef.current = bounds;

      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
      if (autoSearchDebounceRef.current) {
        clearTimeout(autoSearchDebounceRef.current);
        autoSearchDebounceRef.current = null;
      }

      if (!meta?.userInitiated) {
        baselineBoundsRef.current = bounds;
        setPendingBounds(bounds);
        setViewportDirty(false);
        setMapSearchPending(false);
        return;
      }

      viewportDebounceRef.current = setTimeout(() => {
        const baseline = baselineBoundsRef.current;
        if (!baseline) {
          baselineBoundsRef.current = bounds;
          setPendingBounds(bounds);
          setViewportDirty(false);
          setMapSearchPending(false);
          return;
        }
        const dirty = boundsMeaningfullyChanged(bounds, baseline);
        setPendingBounds(bounds);
        setViewportDirty(dirty);

        if (dirty) {
          setMapSearchPending(true);
          autoSearchDebounceRef.current = setTimeout(() => {
            autoSearchDebounceRef.current = null;
            applyLiveBounds(bounds);
          }, 450);
        } else {
          setMapSearchPending(false);
        }
      }, 180);
    },
    [mapBoundsMode, applyLiveBounds]
  );

  useEffect(() => {
    return () => {
      if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
      if (autoSearchDebounceRef.current) clearTimeout(autoSearchDebounceRef.current);
    };
  }, []);

  const handleMarkerClick = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setMobilePreviewId(id);
        return;
      }
      listingRefs.current.get(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    []
  );

  const mobilePreviewMarker = mobilePreviewId
    ? mapMarkers.find((m) => m.id === mobilePreviewId) ?? null
    : null;

  const gridClassName = cn(
    "grid gap-x-4 gap-y-5 p-4 sm:p-5",
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
  );

  const searchAreaButton = (viewportDirty || mapSearchPending) && pendingBounds && mapBoundsMode && (
    <button
      type="button"
      onClick={applyMapAreaSearch}
      disabled={mapSearchPending}
      className="absolute top-4 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-charcoal shadow-float transition hover:border-gold/40 hover:bg-sand/30 disabled:cursor-default disabled:opacity-95"
    >
      {mapSearchPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
      ) : (
        <Search className="h-4 w-4 text-gold" aria-hidden />
      )}
      {mapSearchPending ? t("searchThisAreaPending") : t("searchThisArea")}
    </button>
  );

  const mapPanel = (
    <div className="relative h-full min-h-0 w-full">
      {searchAreaButton}
      {isLgUp && mapOpen && (
        <button
          type="button"
          onClick={() => setMapOpen(false)}
          className="absolute top-3 right-3 z-[500] inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-xs font-semibold text-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:border-charcoal/25"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
          {t("hideMap")}
        </button>
      )}
      <PropertyMapLoader
        key={`${searchKey}|p${pagination.currentPage}`}
        lat={mapCenter.lat}
        lng={mapCenter.lng}
        markers={mapMarkers}
        hoveredMarkerId={hoveredId}
        selectedMarkerId={selectedId}
        zoom={mapZoom}
        height="100%"
        initialBounds={initialBounds}
        searchPolygon={searchPolygon}
        reportBoundsOnMove={false}
        onViewportChange={handleViewportChange}
        clustered
        clusterMarkers={false}
        fitMarkersOnLoad={fitMapToMarkers && !boundsSearch && !searchPolygon?.length}
        fitMaxZoom={fitMapMaxZoom}
        fitMinZoom={fitMapMinZoom}
        onMarkerClick={handleMarkerClick}
        onMarkerHover={setHoveredId}
        onMarkerDeselect={clearMarkerSelection}
        flush
      />
    </div>
  );

  const listingsPagination =
    pagination.totalCount > 0 ? (
      <ListingsPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        onPageChange={setClientPage}
      />
    ) : null;

  const listingsGrid = (
    <>
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="font-display text-lg font-semibold text-charcoal">
            {emptyDueToMinStay ? t("emptyMinStayTitle") : t("emptyCriteriaTitle")}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {emptyDueToMinStay ? t("emptyMinStayHint") : t("emptyCriteriaHint")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {emptyDueToMinStay ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("interestFrom");
                    params.delete("interestTo");
                    params.delete("start");
                    params.delete("end");
                    router.push(`/listings?${params.toString()}`);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:border-gold/30"
                >
                  {t("changeDates")}
                </button>
                <Link
                  href="/listings?rentalType=short_term"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white"
                >
                  {t("viewAllListings")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/listings?rentalType=short_term"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:border-gold/30"
                >
                  {t("clearFilters")}
                </Link>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white"
                >
                  {t("changeSearch")}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={gridClassName}>
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="h-full"
                ref={(el) => {
                  if (el) listingRefs.current.set(listing.id, el);
                  else listingRefs.current.delete(listing.id);
                }}
              >
                <SearchListingCardGrid
                  listing={listing}
                  active={hoveredId === listing.id}
                  onHover={() => setHoveredId(listing.id)}
                  onHoverEnd={() =>
                    setHoveredId((current) => (current === listing.id ? null : current))
                  }
                  favorited={favoriteSet.has(listing.id)}
                  interestFrom={interestFrom}
                  interestTo={interestTo}
                  durationMonths={durationMonths}
                  rentalTypeFilter={rentalType}
                  guests={selectedGuests}
                  listingHref={listingHrefs.get(listing.id)}
                  unavailablePeriods={unavailablePeriodsByListingId[listing.id] ?? []}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  const listingsColumnHeader = (
    <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
      <div className="min-w-0">
        <h1 className="font-display text-lg font-semibold leading-snug text-charcoal">
          {pageTitle}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {pageSubtitle}
          {pagination.totalPages > 1
            ? t("showingRange", {
                start: pagination.rangeStart,
                end: pagination.rangeEnd,
              })
            : ""}
        </p>
        {showDatesHint ? (
          <p className="mt-1 text-xs text-muted/90">
            {t("addDatesHint")}
          </p>
        ) : null}
      </div>
      <ListingsSortSelect
        compact
        className="mt-0.5 shrink-0 rounded-lg border-charcoal/15 px-2.5 py-1.5"
      />
    </div>
  );

  const listingsColumn = (
    <div className="bg-white">
      {listingsColumnHeader}
      {listingsGrid}
      {listingsPagination}
    </div>
  );

  const desktopMapCard = (
    <aside
      className="sticky top-[calc(var(--listings-header-offset)+0.75rem)] z-10 hidden w-[46%] shrink-0 self-start lg:block"
      style={{
        height: "calc(100dvh - var(--listings-header-offset) - 1.75rem)",
      }}
    >
      <div className="h-full pb-6 pl-2 pr-6 pt-1 xl:pl-3 xl:pr-8">
        <div className="relative h-full overflow-hidden rounded-[24px] border border-charcoal/10 bg-[#e8e8e8] shadow-[0_10px_36px_-18px_rgba(26,26,26,0.28)]">
          {mapPanel}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="bg-white">
      {isLgUp ? (
        <div className="flex items-start">
          <div
            className={cn(
              "min-w-0 bg-white transition-[width] duration-300",
              mapOpen ? "w-[54%] shrink-0" : "w-full"
            )}
          >
            {listingsColumn}
          </div>
          {mapOpen ? (
            desktopMapCard
          ) : (
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="fixed bottom-6 right-6 z-[90] inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal shadow-float transition hover:border-gold/30"
            >
              <MapIcon className="h-4 w-4 text-gold" />
              {t("showMap")}
            </button>
          )}
        </div>
      ) : (
        <div>
          {mobileView === "list" && (
            <>
              {listingsColumn}
              <button
                type="button"
                onClick={() => setMobileView("map")}
                className="fixed right-4 bottom-[5.5rem] z-[110] inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-charcoal shadow-float transition hover:border-gold/40"
                aria-label={t("showMap")}
              >
                <MapIcon className="h-4 w-4 text-gold" />
                {t("map")}
              </button>
            </>
          )}

          {mobileView === "map" && (
            <div className="fixed inset-0 z-[120] flex flex-col bg-white pt-[var(--listings-header-offset)]">
              <div className="flex shrink-0 items-center border-b border-border px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="inline-flex min-h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-charcoal"
                >
                  {t("list")}
                </button>
              </div>
              <div className="relative min-h-0 flex-1">
                {mapPanel}
                <MapListingPreviewSheet
                  marker={mobilePreviewMarker}
                  onClose={clearMarkerSelection}
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="fixed bottom-[5.5rem] left-1/2 z-[130] -translate-x-1/2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white shadow-float"
              >
                {t("viewListings")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
