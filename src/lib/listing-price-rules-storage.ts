import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { ListingPriceRule } from "@/lib/types";

const BUCKET = "listing-calendar-data";

function objectPath(listingId: string) {
  return `price-rules/${listingId}.json`;
}

type StoredPayload = {
  rules: ListingPriceRule[];
};

async function ensureBucket(supabase: SupabaseClient): Promise<boolean> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return true;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 256,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    console.error("[price-rules-storage] createBucket", error.message);
    return false;
  }
  return true;
}

export async function readStoredPriceRules(
  listingId: string
): Promise<ListingPriceRule[] | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    if (!(await ensureBucket(supabase))) return null;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(objectPath(listingId));

    if (error || !data) return [];

    const parsed = JSON.parse(await data.text()) as StoredPayload;
    return Array.isArray(parsed.rules) ? parsed.rules : [];
  } catch (error) {
    console.error("[price-rules-storage] read", error);
    return null;
  }
}

export async function writeStoredPriceRules(
  listingId: string,
  rules: ListingPriceRule[]
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    if (!(await ensureBucket(supabase))) return false;

    const payload: StoredPayload = { rules };
    const { error } = await supabase.storage.from(BUCKET).upload(
      objectPath(listingId),
      JSON.stringify(payload),
      { upsert: true, contentType: "application/json" }
    );

    return !error;
  } catch (error) {
    console.error("[price-rules-storage] write", error);
    return false;
  }
}
