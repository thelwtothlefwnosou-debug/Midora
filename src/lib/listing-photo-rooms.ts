"use server";

import { actionError, authActionError, mustSignInError } from "@/lib/action-error-i18n";
import { revalidatePath } from "next/cache";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/constants";
import { LISTING_PHOTOS_BUCKET } from "@/lib/listing-photo-upload";
import { isPhotoRoomKey } from "@/lib/photo-rooms-catalog";
import { createClient } from "@/lib/supabase/server";
import type { ArrivalMethod, ListingImage } from "@/lib/types";

function isSchemaColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    msg.includes("room_key") ||
    msg.includes("caption")
  );
}

async function requireListingOwner(listingId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: await actionError("serviceUnavailable") } as const;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return await mustSignInError();

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listing) return { error: await actionError("listingNotFound") } as const;
  return { supabase, user } as const;
}

function revalidatePhotoPaths(listingId: string) {
  revalidatePath(`/dashboard/listings/${listingId}/photos`);
  revalidatePath(`/dashboard/listings/${listingId}`);
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
}

export async function assignListingImageRoom(
  listingId: string,
  imageId: string,
  roomKey: string | null
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  if (roomKey && !isPhotoRoomKey(roomKey)) {
    return { error: await actionError("invalidRoom") };
  }

  const { error } = await auth.supabase
    .from("listing_images")
    .update({ room_key: roomKey })
    .eq("id", imageId)
    .eq("listing_id", listingId);

  if (error) {
    if (isSchemaColumnError(error)) {
      return {
        error: await actionError("roomMigrationRequired"),
      };
    }
    return { error: await actionError("photoMoveFailed") };
  }

  revalidatePhotoPaths(listingId);
  return { success: true };
}

export async function bulkAssignListingImagesRoom(
  listingId: string,
  imageIds: string[],
  roomKey: string | null
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  if (roomKey && !isPhotoRoomKey(roomKey)) {
    return { error: await actionError("invalidRoom") };
  }

  for (const imageId of imageIds) {
    const { error } = await auth.supabase
      .from("listing_images")
      .update({ room_key: roomKey })
      .eq("id", imageId)
      .eq("listing_id", listingId);

    if (error) {
      if (isSchemaColumnError(error)) {
        return {
          error: await actionError("roomMigrationRequired"),
        };
      }
      return { error: await actionError("roomAssignFailed") };
    }
  }

  revalidatePhotoPaths(listingId);
  return { success: true, count: imageIds.length };
}

export async function updateListingImageCaption(
  listingId: string,
  imageId: string,
  caption: string
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const trimmed = caption.trim().slice(0, 500);

  const { error } = await auth.supabase
    .from("listing_images")
    .update({ caption: trimmed || null })
    .eq("id", imageId)
    .eq("listing_id", listingId);

  if (error) {
    if (isSchemaColumnError(error)) {
      return { error: await actionError("captionMigrationRequired") };
    }
    return { error: await actionError("captionSaveFailed") };
  }

  revalidatePhotoPaths(listingId);
  return { success: true, caption: trimmed || null };
}

export async function uploadListingRoomPhotos(
  listingId: string,
  roomKey: string,
  formData: FormData
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  if (!isPhotoRoomKey(roomKey)) {
    return { error: await actionError("validRoomBeforeUpload") };
  }

  const photoFiles = formData.getAll("photos") as File[];
  const validPhotos = photoFiles.filter((f) => f.size > 0 && f.type.startsWith("image/"));

  if (validPhotos.length === 0) {
    return { error: await actionError("selectAtLeastOnePhoto") };
  }

  const { data: existingMedia } = await auth.supabase
    .from("listing_images")
    .select("id, sort_order, media_type")
    .eq("listing_id", listingId);

  const existingCount = existingMedia?.length ?? 0;
  const remaining = MAX_LISTING_PHOTOS - existingCount;

  if (remaining <= 0) {
    return { error: await actionError("maxFilesPerListing", { count: MAX_LISTING_PHOTOS }) };
  }

  const photosToUpload = validPhotos.slice(0, remaining);
  let sortOrder =
    existingMedia?.reduce((max, row) => Math.max(max, row.sort_order ?? 0), -1) ?? -1;
  sortOrder += 1;

  const inserted: ListingImage[] = [];

  for (let i = 0; i < photosToUpload.length; i++) {
    const file = photosToUpload[i];
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${auth.user.id}/${listingId}/${Date.now()}-room-${roomKey}-${i}.${ext}`;

    const { error: uploadError } = await auth.supabase.storage
      .from(LISTING_PHOTOS_BUCKET)
      .upload(path, file);

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = auth.supabase.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(path);

    const baseRow = {
      listing_id: listingId,
      url: publicUrl,
      sort_order: sortOrder++,
      media_type: "image" as const,
    };

    const { data, error: insertError } = await auth.supabase
      .from("listing_images")
      .insert({ ...baseRow, room_key: roomKey })
      .select("*")
      .single();

    if (insertError && isSchemaColumnError(insertError)) {
      const { data: fallback, error: fallbackError } = await auth.supabase
        .from("listing_images")
        .insert(baseRow)
        .select("*")
        .single();
      if (fallbackError) return { error: fallbackError.message };
      if (fallback) inserted.push(fallback as ListingImage);
      continue;
    }

    if (insertError) return { error: insertError.message };
    if (data) inserted.push(data as ListingImage);
  }

  revalidatePhotoPaths(listingId);
  return { success: true, images: inserted };
}

export async function uploadListingVideo(listingId: string, formData: FormData) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const videoFile = formData.get("video") as File | null;
  const videoDuration = parseInt(String(formData.get("video_duration") ?? ""), 10);

  if (!videoFile?.size) return { error: await actionError("selectVideo") };
  if (!videoFile.type.startsWith("video/")) return { error: await actionError("invalidVideoFile") };
  if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
    return { error: await actionError("videoTooLarge") };
  }
  if (
    !Number.isFinite(videoDuration) ||
    videoDuration <= 0 ||
    videoDuration > MAX_VIDEO_DURATION_SECONDS
  ) {
    return { error: await actionError("videoMaxDuration", { seconds: MAX_VIDEO_DURATION_SECONDS }) };
  }

  const { data: existingMedia } = await auth.supabase
    .from("listing_images")
    .select("id, media_type, sort_order")
    .eq("listing_id", listingId);

  const existingCount = existingMedia?.length ?? 0;
  const existingVideos = existingMedia?.filter((m) => m.media_type === "video").length ?? 0;

  if (existingVideos >= MAX_LISTING_VIDEOS) {
    return { error: await actionError("oneVideoOnly") };
  }
  if (existingCount >= MAX_LISTING_PHOTOS) {
    return { error: await actionError("maxFilesPerListing", { count: MAX_LISTING_PHOTOS }) };
  }

  const ext = videoFile.name.split(".").pop() ?? "mp4";
  const path = `${auth.user.id}/${listingId}/${Date.now()}-video.${ext}`;

  const { error: uploadError } = await auth.supabase.storage
    .from(LISTING_PHOTOS_BUCKET)
    .upload(path, videoFile);

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(path);

  const sortOrder =
    (existingMedia?.reduce((max, row) => Math.max(max, row.sort_order ?? 0), -1) ?? -1) + 1;

  const { error: insertError } = await auth.supabase.from("listing_images").insert({
    listing_id: listingId,
    url: publicUrl,
    sort_order: sortOrder,
    media_type: "video",
    duration_seconds: videoDuration,
  });

  if (insertError) return { error: insertError.message };

  revalidatePhotoPaths(listingId);
  return { success: true };
}

export async function saveListingArrivalSettings(listingId: string, formData: FormData) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const checkInFrom = (formData.get("check_in_from") as string)?.trim() || null;
  const checkInTo = (formData.get("check_in_to") as string)?.trim() || null;
  const checkOutUntil = (formData.get("check_out_until") as string)?.trim() || null;
  const rawArrival = (formData.get("arrival_method") as string)?.trim() || null;
  const arrivalMethod =
    rawArrival === "host" || rawArrival === "self" || rawArrival === "on_request"
      ? (rawArrival as ArrivalMethod)
      : null;

  const { error } = await auth.supabase
    .from("listings")
    .update({
      check_in_from: checkInFrom,
      check_in_to: checkInTo,
      check_out_until: checkOutUntil,
      arrival_method: arrivalMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePhotoPaths(listingId);
  return { success: true };
}
