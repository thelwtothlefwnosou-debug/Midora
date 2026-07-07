import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { ListingImage } from "@/lib/types";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;
type DbError = { message?: string; code?: string; details?: string } | null;

type ExistingMediaRow = {
  id: string;
  sort_order: number;
  media_type?: string;
};

/** Photos include rows with null/undefined media_type (legacy inserts). */
export function isListingPhotoRow(row: { media_type?: string | null }): boolean {
  return row.media_type !== "video";
}

export function isSchemaColumnError(error: DbError): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (msg.includes("could not find") && msg.includes("column")) ||
    msg.includes("schema cache") ||
    (msg.includes("column") && msg.includes("does not exist"))
  );
}

export function logListingImagePersistError(
  insertError: DbError,
  meta: {
    storageUploadResult: { path: string; ok: boolean } | null;
    listingId: string;
    ownerId: string;
    fileName: string;
    mimeType: string;
  }
) {
  if (process.env.NODE_ENV !== "development") return;

  console.error(
    "LISTING_IMAGE_PERSIST_ERROR",
    JSON.stringify(
      {
        storageUploadResult: meta.storageUploadResult,
        insertError: insertError
          ? {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
            }
          : null,
        listingId: meta.listingId,
        ownerId: meta.ownerId,
        fileName: meta.fileName,
        mimeType: meta.mimeType,
      },
      null,
      2
    )
  );
}

function toListingImageRow(
  row: {
    id: string;
    listing_id: string;
    url: string;
    sort_order?: number | null;
    media_type?: string | null;
    created_at?: string | null;
  },
  extended: {
    owner_id: string;
    storage_path: string;
    is_cover: boolean;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }
): ListingImage {
  return {
    id: row.id,
    listing_id: row.listing_id,
    url: row.url,
    sort_order: row.sort_order ?? 0,
    media_type: (row.media_type as ListingImage["media_type"]) ?? "image",
    duration_seconds: null,
    owner_id: extended.owner_id,
    storage_path: extended.storage_path,
    is_cover: extended.is_cover,
    file_name: extended.file_name,
    mime_type: extended.mime_type,
    size_bytes: extended.size_bytes,
    created_at: row.created_at ?? undefined,
  };
}

export async function fetchListingMediaForUpload(
  supabase: SupabaseClient,
  listingId: string
) {
  const withMediaType = await supabase
    .from("listing_images")
    .select("id, media_type, sort_order")
    .eq("listing_id", listingId);

  if (!withMediaType.error) {
    return {
      data: (withMediaType.data ?? []) as ExistingMediaRow[],
      error: null,
    };
  }

  if (isSchemaColumnError(withMediaType.error)) {
    const fallback = await supabase
      .from("listing_images")
      .select("id, sort_order")
      .eq("listing_id", listingId);

    if (!fallback.error) {
      return {
        data: (fallback.data ?? []).map((row) => ({
          id: row.id,
          sort_order: row.sort_order ?? 0,
        })),
        error: null,
      };
    }

    return { data: null, error: fallback.error };
  }

  return { data: null, error: withMediaType.error };
}

export async function countSavedListingPhotos(
  supabase: SupabaseClient,
  listingId: string
): Promise<number> {
  const { data, error } = await fetchListingMediaForUpload(supabase, listingId);
  if (error) return 0;
  return (
    data?.filter(
      (row) => !("media_type" in row) || row.media_type !== "video"
    ).length ?? 0
  );
}

export async function fetchOwnerListingImages(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ images: ListingImage[] | null; error: DbError }> {
  const full = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (!full.error) {
    return {
      images: (full.data ?? []).map((row) => ({
        ...(row as ListingImage),
        media_type:
          ((row as { media_type?: string | null }).media_type ??
            "image") as ListingImage["media_type"],
      })),
      error: null,
    };
  }

  if (!isSchemaColumnError(full.error)) {
    return { images: null, error: full.error };
  }

  const minimal = await supabase
    .from("listing_images")
    .select("id, listing_id, url, sort_order, created_at")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (minimal.error) return { images: null, error: minimal.error };

  return {
    images: (minimal.data ?? []).map((row, index) => ({
      id: row.id,
      listing_id: row.listing_id,
      url: row.url,
      sort_order: row.sort_order ?? index,
      media_type: "image" as const,
      duration_seconds: null,
      owner_id: "",
      storage_path: "",
      is_cover: index === 0,
      file_name: null,
      mime_type: null,
      size_bytes: null,
      created_at: row.created_at ?? undefined,
    })),
    error: null,
  };
}

async function insertWithSelect(
  db: SupabaseClient,
  payload: Record<string, unknown>
): Promise<{ row: ListingImage | null; error: DbError }> {
  const withMediaType = await db
    .from("listing_images")
    .insert(payload)
    .select("id, listing_id, url, sort_order, media_type, created_at");

  if (!withMediaType.error && withMediaType.data?.[0]) {
    return { row: withMediaType.data[0] as ListingImage, error: null };
  }

  if (withMediaType.error && !isSchemaColumnError(withMediaType.error)) {
    return { row: null, error: withMediaType.error };
  }

  const minimal = await db
    .from("listing_images")
    .insert(payload)
    .select("id, listing_id, url, sort_order, created_at");

  if (!minimal.error && minimal.data?.[0]) {
    return { row: minimal.data[0] as ListingImage, error: null };
  }

  return { row: null, error: minimal.error ?? withMediaType.error };
}

export async function insertListingImageAfterUpload(
  userClient: SupabaseClient,
  legacy: {
    listing_id: string;
    url: string;
    sort_order: number;
    media_type: string;
  },
  extended: {
    owner_id: string;
    storage_path: string;
    is_cover: boolean;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }
): Promise<{ data: ListingImage | null; error: DbError }> {
  const service = createServiceClient();
  const db = service ?? userClient;

  const fullPayload = {
    listing_id: legacy.listing_id,
    url: legacy.url,
    sort_order: legacy.sort_order,
    media_type: legacy.media_type,
  };

  let result = await insertWithSelect(db, fullPayload);

  if (!result.row) {
    result = await insertWithSelect(db, {
      listing_id: legacy.listing_id,
      url: legacy.url,
      sort_order: legacy.sort_order,
    });
  }

  if (!result.row) {
    return { data: null, error: result.error ?? { message: "Insert failed" } };
  }

  const image = toListingImageRow(result.row, extended);

  const { error: patchError } = await db
    .from("listing_images")
    .update({
      owner_id: extended.owner_id,
      storage_path: extended.storage_path,
      is_cover: extended.is_cover,
      file_name: extended.file_name,
      mime_type: extended.mime_type,
      size_bytes: extended.size_bytes,
    })
    .eq("id", image.id);

  if (patchError && !isSchemaColumnError(patchError)) {
    return { data: image, error: null };
  }

  return { data: image, error: null };
}
