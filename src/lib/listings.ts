import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { LISTINGS_CATALOG_TAG } from "@/lib/listings-cache";
import { isSupabaseConfigured, shouldUseSeedListings } from "@/lib/supabase/config";
import type { ListingFilters, ListingWithImages } from "@/lib/types";
import {
  filterSeedListings,
  getSeedListingById,
  SEED_LISTINGS,
} from "@/lib/data/seed-listings";
import {
  applyListingFilters,
  sortListings,
} from "@/lib/listing-filters";
import { resolveInterestDateRange } from "@/lib/search-interest-dates";
import {
  filterListingsByAvailability,
} from "@/lib/availability-search";
import { getUnavailablePeriodsByListingIds } from "@/lib/unavailable-periods-db";
import { getListingAmenitiesIndex } from "@/lib/listing-amenities";
import { listingHasAmenityKeys } from "@/lib/listing-public-amenities";
import { PROFILE_CONTACT_SELECT } from "@/lib/profile-contact-select";

function sortImages(listing: ListingWithImages): ListingWithImages {
  return {
    ...listing,
    listing_images: (listing.listing_images ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  };
}

/** Search/map cards need only a cover photo — keeps catalog under Next cache limits. */
function slimCatalogListing(listing: ListingWithImages): ListingWithImages {
  const images = listing.listing_images ?? [];
  const cover =
    images.find((img) => img.is_cover && img.media_type !== "video") ??
    images.find((img) => img.media_type !== "video");
  return {
    ...listing,
    listing_images: cover ? [cover] : [],
  };
}

async function applyFilters(
  listings: ListingWithImages[],
  filters: ListingFilters
): Promise<ListingWithImages[]> {
  let results = sortListings(applyListingFilters(listings, filters), filters.sort);

  if (filters.amenityKeys?.length) {
    const index = await getListingAmenitiesIndex();
    const required = filters.amenityKeys;
    results = results.filter((listing) =>
      listingHasAmenityKeys(listing, required, index.get(listing.id) ?? [])
    );
  }

  const range = resolveInterestDateRange(filters);
  if (range && filters.excludeUnavailableForPeriod) {
    const periodsMap = await getUnavailablePeriodsByListingIds(
      results.map((l) => l.id)
    );
    const slimMap = new Map(
      [...periodsMap.entries()].map(([id, periods]) => [id, periods])
    );
    results = filterListingsByAvailability(results, slimMap, range.from, range.to);
  }

  return results;
}

const LISTING_SELECT =
  `*, listing_images(*), profiles(${PROFILE_CONTACT_SELECT})` as const;

const LISTING_SELECT_MINIMAL = "*, listing_images(*)" as const;

const DEFAULT_APPROVED_FETCH_LIMIT = 500;
const HOMEPAGE_FETCH_LIMIT = 36;

type FetchApprovedOptions = {
  limit?: number;
  minimal?: boolean;
  /** Public reads inside unstable_cache — no cookies/session. */
  useServiceClient?: boolean;
};

function isMissingHiddenColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("is_hidden"));
}

function isMissingProfileContactColumn(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("profiles") ||
    msg.includes("allow_whatsapp") ||
    msg.includes("allow_viber") ||
    msg.includes("allow_phone_contact") ||
    msg.includes("allow_message") ||
    msg.includes("primary_phone_verified_at") ||
    msg.includes("avatar_path") ||
    msg.includes("avatar_status") ||
    msg.includes("show_profile_photo_public") ||
    msg.includes("whatsapp_phone_verified_at") ||
    msg.includes("viber_phone_verified_at") ||
    msg.includes("Could not find")
  );
}

async function fetchApprovedFromDb(
  options: FetchApprovedOptions = {}
): Promise<ListingWithImages[] | null> {
  const fetchLimit = options.limit ?? DEFAULT_APPROVED_FETCH_LIMIT;
  const preferMinimal = options.minimal ?? false;
  const supabase = options.useServiceClient
    ? createServiceClient()
    : await createClient();
  if (!supabase) return null;

  const expiresFilter = `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;

  const db = supabase;

  async function runQuery(select: string) {
    let result = await db
      .from("listings")
      .select(select)
      .eq("status", "approved")
      .eq("is_hidden", false)
      .or(expiresFilter)
      .order("created_at", { ascending: false })
      .limit(fetchLimit);

    if (isMissingHiddenColumn(result.error)) {
      result = await db
        .from("listings")
        .select(select)
        .eq("status", "approved")
        .or(expiresFilter)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);
    }

    return result;
  }

  let result = await runQuery(preferMinimal ? LISTING_SELECT_MINIMAL : LISTING_SELECT);

  if (!preferMinimal && isMissingProfileContactColumn(result.error)) {
    result = await runQuery(LISTING_SELECT_MINIMAL);
  }

  if (result.error) {
    console.error("[listings] Supabase fetch error:", result.error.message);
    return null;
  }

  return (result.data ?? []).map((item) =>
    sortImages(item as unknown as ListingWithImages)
  );
}

async function loadApprovedListingsSnapshot(): Promise<ListingWithImages[] | null> {
  if (!isSupabaseConfigured()) return null;
  return fetchApprovedFromDb({ useServiceClient: true });
}

const getApprovedListingsSnapshotCached = unstable_cache(
  loadApprovedListingsSnapshot,
  ["midora-approved-listings-snapshot"],
  { revalidate: 60, tags: [LISTINGS_CATALOG_TAG] }
);

async function loadSearchCatalogSnapshot(): Promise<ListingWithImages[] | null> {
  if (!isSupabaseConfigured()) return null;
  const rows = await fetchApprovedFromDb({
    useServiceClient: true,
    limit: DEFAULT_APPROVED_FETCH_LIMIT,
    minimal: true,
  });
  if (!rows) return null;
  return rows.map((listing) => slimCatalogListing(sortImages(listing)));
}

const getSearchCatalogSnapshotCached = unstable_cache(
  loadSearchCatalogSnapshot,
  ["midora-search-catalog-slim-catalog-v1"],
  { revalidate: 60, tags: [LISTINGS_CATALOG_TAG] }
);

async function getSearchCatalogSnapshot(): Promise<ListingWithImages[] | null> {
  if (process.env.NODE_ENV === "development") {
    return loadSearchCatalogSnapshot();
  }
  try {
    return await getSearchCatalogSnapshotCached();
  } catch (error) {
    console.error(
      "[listings] search catalog cache unavailable, using direct fetch:",
      error
    );
    return loadSearchCatalogSnapshot();
  }
}

async function resolveCatalogListings(
  snapshot: ListingWithImages[] | null,
  filters: ListingFilters,
  limit: number
): Promise<ListingWithImages[]> {
  if (snapshot === null) {
    return shouldUseSeedListings() ? filterSeedListings(filters, limit) : [];
  }
  if (snapshot.length === 0) {
    return shouldUseSeedListings() ? filterSeedListings(filters, limit) : [];
  }
  return (await applyFilters(snapshot, filters)).slice(0, limit);
}

export type SitemapListingEntry = {
  id: string;
  slug: string | null;
  updated_at: string;
};

export async function getSitemapListingEntries(): Promise<SitemapListingEntry[]> {
  if (!isSupabaseConfigured()) {
    return shouldUseSeedListings()
      ? SEED_LISTINGS.filter((l) => l.status === "approved").map((l) => ({
          id: l.id,
          slug: l.slug ?? null,
          updated_at: l.updated_at ?? l.created_at,
        }))
      : [];
  }

  const supabase = createServiceClient();
  if (!supabase) return [];

  const expiresFilter = `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;

  let result = await supabase
    .from("listings")
    .select("id, slug, updated_at")
    .eq("status", "approved")
    .eq("is_hidden", false)
    .or(expiresFilter)
    .order("updated_at", { ascending: false })
    .limit(2000);

  if (isMissingHiddenColumn(result.error)) {
    result = await supabase
      .from("listings")
      .select("id, slug, updated_at")
      .eq("status", "approved")
      .or(expiresFilter)
      .order("updated_at", { ascending: false })
      .limit(2000);
  }

  if (result.error) {
    console.error("[sitemap] listings fetch:", result.error.message);
    return [];
  }

  return (result.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug ?? null,
    updated_at: row.updated_at,
  }));
}

/** Approved listings: Supabase when configured, seed data μόνο σε dev fallback */
export async function getApprovedListings(
  filters: ListingFilters = {},
  limit = 100
): Promise<ListingWithImages[]> {
  if (!isSupabaseConfigured()) {
    return shouldUseSeedListings() ? filterSeedListings(filters, limit) : [];
  }

  const dbListings = await getApprovedListingsSnapshotCached();

  if (dbListings === null) {
    return shouldUseSeedListings() ? filterSeedListings(filters, limit) : [];
  }

  if (dbListings.length === 0) {
    return shouldUseSeedListings() ? filterSeedListings(filters, limit) : [];
  }

  return (await applyFilters(dbListings, filters)).slice(0, limit);
}

/** Lighter catalog for search + map — no profile join, cached separately. */
export async function getSearchCatalogListings(
  filters: ListingFilters = {},
  limit = DEFAULT_APPROVED_FETCH_LIMIT
): Promise<ListingWithImages[]> {
  if (!isSupabaseConfigured()) {
    return shouldUseSeedListings() ? filterSeedListings(filters, limit) : [];
  }
  const snapshot = await getSearchCatalogSnapshot();
  return resolveCatalogListings(snapshot, filters, limit);
}

async function loadHomepageRecentListings(): Promise<ListingWithImages[]> {
  if (!isSupabaseConfigured()) {
    return shouldUseSeedListings()
      ? filterSeedListings({ sort: "newest" }, HOMEPAGE_FETCH_LIMIT)
      : [];
  }

  const dbListings = await fetchApprovedFromDb({
    limit: HOMEPAGE_FETCH_LIMIT,
    minimal: true,
    useServiceClient: true,
  });

  if (dbListings === null || dbListings.length === 0) {
    return shouldUseSeedListings()
      ? filterSeedListings({ sort: "newest" }, HOMEPAGE_FETCH_LIMIT)
      : [];
  }

  return sortListings(dbListings, "newest");
}

const getHomepageRecentListingsCached = unstable_cache(
  loadHomepageRecentListings,
  ["midora-homepage-recent-listings"],
  { revalidate: 60 }
);

/** Lean fetch for homepage cards — small DB window + short cache. */
export async function getHomepageRecentListings(): Promise<ListingWithImages[]> {
  return getHomepageRecentListingsCached();
}

export async function getApprovedListingsCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return shouldUseSeedListings() ? SEED_LISTINGS.length : 0;
  }

  const supabase = await createClient();
  if (!supabase) return shouldUseSeedListings() ? SEED_LISTINGS.length : 0;

  const expiresFilter = `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;

  let result = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("is_hidden", false)
    .or(expiresFilter);

  if (isMissingHiddenColumn(result.error)) {
    result = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .or(expiresFilter);
  }

  const { count, error } = result;

  if (error || count === null) {
    return shouldUseSeedListings() ? SEED_LISTINGS.length : 0;
  }

  if (count === 0) {
    return shouldUseSeedListings() ? SEED_LISTINGS.length : 0;
  }

  return count;
}

export async function getListingById(id: string): Promise<ListingWithImages | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

  if (isSupabaseConfigured()) {
    const clients = [await createClient(), createServiceClient()].filter(
      (client): client is NonNullable<typeof client> => Boolean(client)
    );

    const columns = isUuid ? (["id", "slug"] as const) : (["slug", "id"] as const);
    const selects = [LISTING_SELECT_MINIMAL, "*, listing_images(*)", LISTING_SELECT] as const;

    for (const supabase of clients) {
      for (const column of columns) {
        for (const select of selects) {
          const lookupValue =
            column === "slug" && !isUuid ? trimmed.toLowerCase() : trimmed;

          const { data, error } = await supabase
            .from("listings")
            .select(select)
            .eq(column, lookupValue)
            .maybeSingle();

          if (!error && data) {
            return sortImages(data as unknown as ListingWithImages);
          }

          if (
            error &&
            !isMissingProfileContactColumn(error) &&
            !isMissingHiddenColumn(error)
          ) {
            continue;
          }
        }
      }
    }

    const approved = await fetchApprovedFromDb({ useServiceClient: true });
    if (approved) {
      const slugNeedle = trimmed.toLowerCase();
      const match = approved.find(
        (l) => l.id === trimmed || l.slug === trimmed || l.slug === slugNeedle
      );
      if (match) return match;
    }
  }

  if (shouldUseSeedListings()) {
    return getSeedListingById(trimmed);
  }

  return null;
}

export async function getUserListings(userId: string): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listings] getUserListings:", error.message);
    return [];
  }

  return (data ?? []) as ListingWithImages[];
}

/** Lightweight owner listings for dashboard chrome (notifications) — no images. */
export async function getUserListingsForDashboardShell(
  userId: string
): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, slug, status, approval_status, published_at, expires_at, updated_at, created_at, user_id"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[listings] getUserListingsForDashboardShell:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    listing_images: [],
  })) as unknown as ListingWithImages[];
}

export async function getPendingListings() {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[listings] getPendingListings:", error.message);
    return [];
  }

  return data ?? [];
}

export async function geocodeAddress(
  city: string,
  area: string,
  address?: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [address, area, city, "Greece"].filter(Boolean).join(", ");

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { "User-Agent": "Midora/1.0" } }
    );
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // fallback
  }

  return null;
}

export function isListingActive(listing: {
  status: string;
  expires_at: string | null;
  is_hidden?: boolean | null;
}) {
  if (listing.is_hidden) return false;
  if (listing.status !== "approved") return false;
  if (!listing.expires_at) return true;
  return new Date(listing.expires_at) > new Date();
}

export { getListingCoverImage } from "@/lib/listing-media";
export { SEED_LISTINGS };
