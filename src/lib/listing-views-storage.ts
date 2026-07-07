import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

const BUCKET = "listing-metrics";

function viewObjectPath(listingId: string) {
  return `views/${listingId}.json`;
}

async function ensureMetricsBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === BUCKET)) return;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 512,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

async function readStoredCount(
  supabase: SupabaseClient,
  listingId: string
): Promise<number> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(viewObjectPath(listingId));

  if (error || !data) return 0;

  try {
    const parsed = JSON.parse(await data.text()) as { count?: unknown };
    return typeof parsed.count === "number" && parsed.count >= 0
      ? Math.floor(parsed.count)
      : 0;
  } catch {
    return 0;
  }
}

/** Fallback when DB migration is not applied yet. */
export async function incrementStoredListingView(listingId: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    await ensureMetricsBucket(supabase);
    const current = await readStoredCount(supabase, listingId);
    const { error } = await supabase.storage.from(BUCKET).upload(
      viewObjectPath(listingId),
      JSON.stringify({ count: current + 1 }),
      { upsert: true, contentType: "application/json" }
    );
    return !error;
  } catch (error) {
    console.error("[listing-view-storage]", error);
    return false;
  }
}

export async function getStoredListingViewCounts(
  listingIds: string[]
): Promise<Record<string, number>> {
  const supabase = createServiceClient();
  if (!supabase || listingIds.length === 0) return {};

  try {
    await ensureMetricsBucket(supabase);
  } catch {
    return {};
  }

  const counts: Record<string, number> = {};
  await Promise.all(
    listingIds.map(async (listingId) => {
      counts[listingId] = await readStoredCount(supabase, listingId);
    })
  );
  return counts;
}

export async function attachStoredViewCounts<
  T extends { id: string; view_count?: number | null },
>(listings: T[]): Promise<T[]> {
  if (listings.length === 0) return listings;

  const stored = await getStoredListingViewCounts(listings.map((listing) => listing.id));
  if (Object.keys(stored).length === 0) return listings;

  return listings.map((listing) => ({
    ...listing,
    view_count: (listing.view_count ?? 0) + (stored[listing.id] ?? 0),
  }));
}
