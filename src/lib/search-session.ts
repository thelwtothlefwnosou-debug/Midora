/**
 * Scalable public search session:
 * - exact match count (no 500 cap)
 * - lightweight index rows (chunked)
 * - rotating window ≤ 270 (15 × 18)
 * - hydrate only current page (18 full cards)
 * - privacy-safe lightweight markers for the window
 */
import "server-only";

import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { LISTINGS_CATALOG_TAG } from "@/lib/listings-cache";
import { isSupabaseConfigured, shouldUseSeedListings } from "@/lib/supabase/config";
import type { ListingFilters, ListingWithImages } from "@/lib/types";
import {
  filterSeedListings,
  SEED_LISTINGS,
} from "@/lib/data/seed-listings";
import { applyListingFilters, sortListings } from "@/lib/listing-filters";
import { getListingAmenitiesIndex } from "@/lib/listing-amenities";
import { listingHasAmenityKeys } from "@/lib/listing-public-amenities";
import { applyPublicSearchLocationPrivacy } from "@/lib/listing-map";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import {
  resolveListingSearchPrice,
  type ListingSearchPriceContext,
} from "@/lib/listing-search-links";
import type { MapMarker } from "@/components/map/types";
import {
  hashSeededId,
  orderListingsBySeed,
} from "@/lib/listings-result-seed";
import {
  LISTINGS_PAGE_SIZE,
  SEARCH_SESSION_MAX_PAGES,
  SEARCH_SESSION_WINDOW_SIZE,
} from "@/lib/listings-pagination";

/** Lightweight nested images for quality gate + marker thumbs — avoid full `*` image payloads. */
const SEARCH_INDEX_SELECT =
  "*, listing_images(url, media_type, is_cover, sort_order)";

const INDEX_CHUNK = 1000;
const INDEX_HARD_CAP = 20000;

export type SearchIndexListing = ListingWithImages;

function toIndexListing(row: ListingWithImages): SearchIndexListing {
  const images = [...(row.listing_images ?? [])]
    .filter((img) => img.media_type !== "video")
    .sort((a, b) => {
      const aCover = a.is_cover ? 1 : 0;
      const bCover = b.is_cover ? 1 : 0;
      if (aCover !== bCover) return bCover - aCover;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .slice(0, 4);

  return applyPublicSearchLocationPrivacy({
    ...row,
    description: "",
    description_en: null,
    listing_images: images,
  });
}

export type SearchSessionResult = {
  /** Exact matching count (full corpus after filters). */
  totalCount: number;
  /** Size of this session's rotating window (≤ 270). */
  windowCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  /** Full public cards for the current page only (≤ 18). */
  pageListings: ListingWithImages[];
  /** Privacy-safe markers for the rotating window. */
  markers: MapMarker[];
  windowIds: string[];
};

function publicationTimeMs(listing: {
  published_at?: string | null;
  created_at?: string | null;
}): number {
  const raw = listing.published_at || listing.created_at;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Soft recency boost inside deterministic seeded ranking.
 * Newer listings get a small score nudge; older stay fully eligible.
 * Same seed → same order.
 */
export function orderListingsBySeedWithRecency<
  T extends { id: string; published_at?: string | null; created_at?: string | null },
>(listings: T[], seed: string): T[] {
  if (listings.length <= 1) return listings.slice();
  const now = Date.now();
  return listings
    .map((item, index) => {
      const base = hashSeededId(seed, item.id) / 0xffffffff;
      const published = publicationTimeMs(item);
      const ageDays = published > 0 ? (now - published) / 86_400_000 : 999;
      const recencyBoost = ageDays < 30 ? (1 - ageDays / 30) * 0.12 : 0;
      return { item, index, rank: base - recencyBoost };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.item.id < b.item.id) return -1;
      if (a.item.id > b.item.id) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

async function fetchSearchIndexChunked(): Promise<SearchIndexListing[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const expiresFilter = `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;
  const all: SearchIndexListing[] = [];
  let from = 0;

  while (all.length < INDEX_HARD_CAP) {
    const to = from + INDEX_CHUNK - 1;
    let result = await supabase
      .from("listings")
      .select(SEARCH_INDEX_SELECT)
      .eq("status", "approved")
      .eq("is_hidden", false)
      .or(expiresFilter)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (result.error?.message?.includes("is_hidden")) {
      result = await supabase
        .from("listings")
        .select(SEARCH_INDEX_SELECT)
        .eq("status", "approved")
        .or(expiresFilter)
        .order("created_at", { ascending: false })
        .range(from, to);
    }

    if (result.error) {
      console.error("[search-session] index fetch:", result.error.message);
      break;
    }

    const rows = (result.data ?? []) as unknown as SearchIndexListing[];
    if (rows.length === 0) break;
    all.push(...rows.map(toIndexListing));
    if (rows.length < INDEX_CHUNK) break;
    from += INDEX_CHUNK;
  }

  return all;
}

async function loadSearchIndexSnapshot(): Promise<SearchIndexListing[]> {
  if (!isSupabaseConfigured()) {
    return shouldUseSeedListings()
      ? (SEED_LISTINGS.filter((l) => l.status === "approved") as SearchIndexListing[])
      : [];
  }
  return fetchSearchIndexChunked();
}

const getSearchIndexSnapshotCached = unstable_cache(
  loadSearchIndexSnapshot,
  ["midora-search-index-v2-star-select"],
  { revalidate: 60, tags: [LISTINGS_CATALOG_TAG] }
);

async function getSearchIndexSnapshot(): Promise<SearchIndexListing[]> {
  if (process.env.NODE_ENV === "development") {
    return loadSearchIndexSnapshot();
  }
  try {
    return await getSearchIndexSnapshotCached();
  } catch (error) {
    console.error("[search-session] cache miss fallback:", error);
    return loadSearchIndexSnapshot();
  }
}

async function matchSearchIndex(
  filters: ListingFilters
): Promise<SearchIndexListing[]> {
  if (!isSupabaseConfigured()) {
    if (!shouldUseSeedListings()) return [];
    return filterSeedListings(filters, Number.MAX_SAFE_INTEGER) as SearchIndexListing[];
  }

  const snapshot = await getSearchIndexSnapshot();
  let results = sortListings(
    applyListingFilters(snapshot, filters),
    filters.sort
  ) as SearchIndexListing[];

  if (filters.amenityKeys?.length) {
    const index = await getListingAmenitiesIndex();
    const required = filters.amenityKeys;
    results = results.filter((listing) =>
      listingHasAmenityKeys(listing, required, index.get(listing.id) ?? [])
    );
  }

  return results;
}

function slimCardListing(listing: ListingWithImages): ListingWithImages {
  const images = listing.listing_images ?? [];
  const photos = [...images]
    .filter((img) => img.media_type !== "video")
    .sort((a, b) => {
      const aCover = a.is_cover ? 1 : 0;
      const bCover = b.is_cover ? 1 : 0;
      if (aCover !== bCover) return bCover - aCover;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .slice(0, 8)
    .map((img) => ({
      ...img,
      media_type: img.media_type ?? ("image" as const),
      is_cover: Boolean(img.is_cover),
    }));

  return applyPublicSearchLocationPrivacy({
    ...listing,
    description: "",
    description_en: null,
    listing_images: photos,
  });
}

async function hydrateListingsByIds(ids: string[]): Promise<ListingWithImages[]> {
  if (!ids.length) return [];

  if (!isSupabaseConfigured()) {
    if (!shouldUseSeedListings()) return [];
    const byId = new Map(SEED_LISTINGS.map((l) => [l.id, l]));
    return ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((l) => slimCardListing(l as ListingWithImages));
  }

  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .in("id", ids);

  if (error) {
    console.error("[search-session] hydrate:", error.message);
    return [];
  }

  const order = new Map(ids.map((id, i) => [id, i]));
  const rows = ((data ?? []) as unknown as ListingWithImages[])
    .map((row) =>
      slimCardListing({
        ...row,
        listing_images: [...(row.listing_images ?? [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        ),
      })
    )
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const { attachMonthlyPriceTiersToListings } = await import(
    "@/lib/listing-monthly-tiers-db"
  );
  return attachMonthlyPriceTiersToListings(rows);
}

function buildWindowMarkers(
  windowRows: SearchIndexListing[],
  priceContext?: ListingSearchPriceContext
): MapMarker[] {
  const markers: MapMarker[] = [];

  for (const listing of windowRows) {
    const publicListing = applyPublicSearchLocationPrivacy(listing);
    if (
      publicListing.latitude == null ||
      publicListing.longitude == null ||
      !Number.isFinite(publicListing.latitude) ||
      !Number.isFinite(publicListing.longitude)
    ) {
      continue;
    }

    const resolved = resolveListingSearchPrice(publicListing, priceContext ?? {});
    markers.push({
      id: publicListing.id,
      lat: publicListing.latitude,
      lng: publicListing.longitude,
      title: publicListing.title,
      price: resolved.sortAmount,
      priceLabel: resolved.priceLabel,
      priceUnit: resolved.priceUnit,
      area: publicListing.area,
      city: publicListing.city,
      coverUrl: pickListingCoverPhotoUrl(publicListing),
      href: `/listings/${publicListing.slug ?? publicListing.id}`,
    });
  }

  return markers;
}

function selectRotatingWindow(
  matched: SearchIndexListing[],
  seed: string | null
): SearchIndexListing[] {
  if (matched.length === 0) return [];
  const ordered = seed
    ? orderListingsBySeedWithRecency(matched, seed)
    : orderListingsBySeed(
        sortListings(matched, "recommended") as SearchIndexListing[],
        "bootstrap"
      );
  return ordered.slice(0, SEARCH_SESSION_WINDOW_SIZE);
}

export async function getExactSearchMatchCount(
  filters: ListingFilters = {}
): Promise<number> {
  const matched = await matchSearchIndex(filters);
  return matched.length;
}

export async function getSearchSession(options: {
  filters: ListingFilters;
  seed: string | null;
  page: number;
  priceContext?: ListingSearchPriceContext;
}): Promise<SearchSessionResult> {
  const matched = await matchSearchIndex(options.filters);
  const totalCount = matched.length;
  const windowRows = selectRotatingWindow(matched, options.seed);
  const windowCount = windowRows.length;
  const maxPages = Math.min(
    SEARCH_SESSION_MAX_PAGES,
    Math.max(1, Math.ceil(windowCount / LISTINGS_PAGE_SIZE) || 1)
  );
  const currentPage = Math.min(Math.max(1, options.page), maxPages);
  const offset = (currentPage - 1) * LISTINGS_PAGE_SIZE;
  const pageIds = windowRows.slice(offset, offset + LISTINGS_PAGE_SIZE).map((l) => l.id);
  const pageListings = await hydrateListingsByIds(pageIds);
  const markers = buildWindowMarkers(windowRows, options.priceContext);

  return {
    totalCount,
    windowCount,
    totalPages: maxPages,
    currentPage,
    pageSize: LISTINGS_PAGE_SIZE,
    rangeStart: windowCount === 0 ? 0 : offset + 1,
    rangeEnd: Math.min(offset + LISTINGS_PAGE_SIZE, windowCount),
    pageListings,
    markers,
    windowIds: windowRows.map((l) => l.id),
  };
}
