import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { ListingUnavailablePeriod } from "@/lib/unavailable-periods";
import { mergeUnavailableRange } from "@/lib/unavailable-periods";

const BUCKET = "listing-calendar-data";

function objectPath(listingId: string) {
  return `unavailable/${listingId}.json`;
}

type StoredPayload = {
  periods: ListingUnavailablePeriod[];
};

async function ensureBucket(supabase: SupabaseClient): Promise<boolean> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return true;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 256,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    console.error("[unavailable-periods-storage] createBucket", error.message);
    return false;
  }
  return true;
}

export async function readStoredUnavailablePeriods(
  listingId: string
): Promise<ListingUnavailablePeriod[] | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    if (!(await ensureBucket(supabase))) return null;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(objectPath(listingId));

    if (error || !data) return [];

    const parsed = JSON.parse(await data.text()) as StoredPayload;
    return Array.isArray(parsed.periods) ? parsed.periods : [];
  } catch (error) {
    console.error("[unavailable-periods-storage] read", error);
    return null;
  }
}

export async function writeStoredUnavailablePeriods(
  listingId: string,
  periods: ListingUnavailablePeriod[]
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    if (!(await ensureBucket(supabase))) return false;

    const payload: StoredPayload = { periods };
    const { error } = await supabase.storage.from(BUCKET).upload(
      objectPath(listingId),
      JSON.stringify(payload),
      { upsert: true, contentType: "application/json" }
    );

    return !error;
  } catch (error) {
    console.error("[unavailable-periods-storage] write", error);
    return false;
  }
}

export async function readStoredUnavailablePeriodsForListings(
  listingIds: string[]
): Promise<Map<string, ListingUnavailablePeriod[]>> {
  const map = new Map<string, ListingUnavailablePeriod[]>();
  if (listingIds.length === 0) return map;

  await Promise.all(
    listingIds.map(async (id) => {
      const periods = await readStoredUnavailablePeriods(id);
      if (periods) map.set(id, periods);
    })
  );
  return map;
}

export async function saveUnavailablePeriodToStorage(
  listingId: string,
  ownerId: string,
  startDate: string,
  endDate: string,
  options?: {
    periodId?: string | null;
    reason?: string | null;
    note?: string | null;
    mergeIds?: string[];
  }
): Promise<ListingUnavailablePeriod[] | null> {
  const existing = (await readStoredUnavailablePeriods(listingId)) ?? [];
  const now = new Date().toISOString();
  let next = existing.filter((p) => !(options?.mergeIds ?? []).includes(p.id));

  if (options?.periodId) {
    next = next.map((p) =>
      p.id === options.periodId
        ? {
            ...p,
            start_date: startDate,
            end_date: endDate,
            reason: (options.reason as ListingUnavailablePeriod["reason"]) ?? p.reason,
            note: options.note ?? p.note,
            updated_at: now,
          }
        : p
    );
  } else {
    next.push({
      id: crypto.randomUUID(),
      listing_id: listingId,
      owner_id: ownerId,
      start_date: startDate,
      end_date: endDate,
      reason: (options?.reason as ListingUnavailablePeriod["reason"]) ?? "unavailable",
      note: options?.note ?? null,
      created_at: now,
      updated_at: now,
    });
  }

  next.sort((a, b) => a.start_date.localeCompare(b.start_date));
  const ok = await writeStoredUnavailablePeriods(listingId, next);
  return ok ? next.filter((p) => p.owner_id === ownerId) : null;
}

export async function deleteUnavailablePeriodFromStorage(
  listingId: string,
  periodId: string
): Promise<ListingUnavailablePeriod[] | null> {
  const existing = (await readStoredUnavailablePeriods(listingId)) ?? [];
  const next = existing.filter((p) => p.id !== periodId);
  const ok = await writeStoredUnavailablePeriods(listingId, next);
  return ok ? next : null;
}

export function computeStorageMerge(
  existing: ListingUnavailablePeriod[],
  startDate: string,
  endDate: string,
  periodId?: string | null
) {
  return mergeUnavailableRange(existing, startDate, endDate, periodId ?? undefined);
}
