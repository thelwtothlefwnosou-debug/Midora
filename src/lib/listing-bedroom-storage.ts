import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { ListingSleepingArrangement } from "@/lib/types";

const BUCKET = "listing-calendar-data";

function objectPath(listingId: string) {
  return `bedrooms/${listingId}.json`;
}

type StoredPayload = {
  arrangements: ListingSleepingArrangement[];
};

async function ensureBucket(supabase: SupabaseClient): Promise<boolean> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return true;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 256,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    console.error("[bedroom-storage] createBucket", error.message);
    return false;
  }
  return true;
}

export async function readStoredBedrooms(
  listingId: string
): Promise<ListingSleepingArrangement[] | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    if (!(await ensureBucket(supabase))) return null;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(objectPath(listingId));

    if (error || !data) return [];

    const parsed = JSON.parse(await data.text()) as StoredPayload;
    return Array.isArray(parsed.arrangements) ? parsed.arrangements : [];
  } catch (error) {
    console.error("[bedroom-storage] read", error);
    return null;
  }
}

export async function writeStoredBedrooms(
  listingId: string,
  arrangements: ListingSleepingArrangement[]
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    if (!(await ensureBucket(supabase))) return false;

    const payload: StoredPayload = { arrangements };
    const { error } = await supabase.storage.from(BUCKET).upload(
      objectPath(listingId),
      JSON.stringify(payload),
      { upsert: true, contentType: "application/json" }
    );

    return !error;
  } catch (error) {
    console.error("[bedroom-storage] write", error);
    return false;
  }
}
