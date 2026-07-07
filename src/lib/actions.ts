"use server";

import { revalidatePath } from "next/cache";
import { revalidateListingsCatalog } from "@/lib/listings-cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { geocodeAddress } from "@/lib/listings";
import { safePostAuthPath } from "@/lib/auth-redirect";
import { normalizePhoneToE164, isValidGreekMobileE164 } from "@/lib/phone-e164";
import { listingPhoneReadyForCalls } from "@/lib/listing-contact";
import { randomUUID } from "crypto";
import {
  MIN_LISTING_PHOTOS_FOR_REVIEW,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_SIZE_BYTES,
  MAX_PHOTO_SIZE_BYTES,
  REQUIRE_LISTING_PHONE_SMS_VERIFICATION,
} from "@/lib/constants";
import {
  countSavedListingPhotos,
  fetchListingMediaForUpload,
  fetchOwnerListingImages,
  insertListingImageAfterUpload,
  isSchemaColumnError,
  logListingImagePersistError,
} from "@/lib/listing-image-db";
import {
  LISTING_PHOTOS_BUCKET,
  normalizeListingPhotoExtension,
  isAcceptedListingPhotoType,
  LISTING_PHOTO_UNSUPPORTED_MSG,
} from "@/lib/listing-photo-upload";
import {
  LISTING_SAVE_ERROR_MSG,
  MIN_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_TITLE_LENGTH,
  validateBasicDetails,
} from "@/lib/listing-wizard-validation";
import {
  buildPortalListingRow,
  parsePortalListingFields,
  validatePortalListingFields,
} from "@/lib/listing-portal-payload";
import { insertListingRow, updateListingRow } from "@/lib/listing-db-write";
import { rewardReferrerForListingApproval, resolveReferrerId } from "@/lib/referrals";
import { storagePathFromPublicUrl } from "@/lib/storage";
import type { ListingImage } from "@/lib/types";
import { logAppEvent } from "@/lib/admin/audit";
import {
  toggleFavoriteForUser,
  removeFavoriteByIds,
  revalidateFavoritePaths,
} from "@/lib/favorites";
import { getListingById, isListingActive } from "@/lib/listings";
import { mapLeadError } from "@/lib/leads";
import {
  isListingAvailabilityStatus,
  parseListingAvailabilityStatus,
} from "@/lib/listing-availability-status";
import type { PropertyLeadStatus } from "@/lib/types";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" };

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const referralCode = (formData.get("referral_code") as string)?.trim();
  const redirectTo = safePostAuthPath(
    (formData.get("redirect") as string) ||
      (formData.get("next") as string) ||
      "/dashboard"
  );

  const service = createServiceClient();
  const referrerId = service
    ? await resolveReferrerId(service, referralCode)
    : null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) return { error: translateAuthError(error.message) };

  if (data.user) {
    const db = createServiceClient() ?? supabase;
    await db.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName,
        phone,
        referred_by: referrerId,
        referral_code: generateReferralCodeFromId(data.user.id),
      },
      { onConflict: "id" }
    );
  }

  if (!data.session) {
    return { needsConfirmation: true, email };
  }

  redirect(redirectTo);
}

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς" };

  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const redirectTo = safePostAuthPath((formData.get("redirect") as string) || "/dashboard");

  if (!fullName || !phone) {
    return { error: "Συμπλήρωσε όνομα και τηλέφωνο" };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      phone,
    },
    { onConflict: "id" }
  );

  if (error) {
    const admin = createServiceClient();
    if (admin) {
      const { error: adminErr } = await admin.from("profiles").upsert(
        { id: user.id, full_name: fullName, phone },
        { onConflict: "id" }
      );
      if (adminErr) return { error: adminErr.message };
    } else {
      return { error: error.message };
    }
  }

  await supabase.auth.updateUser({
    data: { full_name: fullName, phone },
  });

  redirect(redirectTo);
}

function generateReferralCodeFromId(userId: string) {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function translateAuthError(message: string): string {
  if (message.includes("already registered")) {
    return "Αυτό το email είναι ήδη εγγεγραμμένο. Δοκίμασε σύνδεση.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Λάθος email ή κωδικός.";
  }
  return message;
}

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Πρέπει να συνδεθείς" as const };
  return { supabase, user };
}

async function requireAdmin() {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Δεν έχεις δικαίωμα" as const };
  return auth;
}

async function requireListingOwner(listingId: string) {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const { data: listing } = await auth.supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();
  if (!listing || listing.user_id !== auth.user.id) {
    return { error: "Δεν έχεις πρόσβαση" as const };
  }
  return { ...auth, listing };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" };

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translateAuthError(error.message) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { promoteAdminFromEmail } = await import("@/lib/admin/auth");
    await promoteAdminFromEmail(user.id, user.email);
  }

  const redirectTo = safePostAuthPath((formData.get("redirect") as string) || "/dashboard");
  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" };

  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "Βάλε το email σου" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/update-password&type=recovery`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase δεν είναι ρυθμισμένο" };

  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function updateProfile(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  if (!fullName || !phone) return { error: "Συμπλήρωσε όνομα και τηλέφωνο" };

  const { error } = await auth.supabase.from("profiles").upsert(
    { id: auth.user.id, full_name: fullName, phone },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  await auth.supabase.auth.updateUser({ data: { full_name: fullName, phone } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

function toListingSaveError(error: { message?: string } | null): string {
  if (!error?.message) return LISTING_SAVE_ERROR_MSG;
  const msg = error.message.toLowerCase();

  if (process.env.NODE_ENV === "development") {
    console.error("[listing-save]", error.message);
  }

  if (msg.includes("profiles") && msg.includes("foreign key")) {
    return "Δεν ήταν δυνατή η αποθήκευση. Συμπλήρωσε το προφίλ σου από τις Ρυθμίσεις και δοκίμασε ξανά.";
  }
  if (msg.includes("price_monthly") || msg.includes("price_per_night")) {
    return "Η τιμή πρέπει να είναι μεγαλύτερη από 0.";
  }
  if (msg.includes("max_guests")) {
    return "Ο μέγιστος αριθμός ατόμων πρέπει να είναι μεγαλύτερος από 0.";
  }
  if (msg.includes("sqm")) {
    return "Τα τετραγωνικά μέτρα πρέπει να είναι μεγαλύτερα από 0.";
  }

  return LISTING_SAVE_ERROR_MSG;
}

async function ensureOwnerProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  user: { id: string; user_metadata?: Record<string, unknown>; email?: string }
) {
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    "Χρήστης";
  const phone =
    (typeof user.user_metadata?.phone === "string" && user.user_metadata.phone) || "";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      phone,
    },
    { onConflict: "id" }
  );
}


function logPhotoUploadDevError(
  stage: "storage" | "database",
  error: { message?: string },
  meta: Record<string, unknown>
) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[listing-photo-upload:${stage}]`, error.message, meta);
  }
}

async function listingImagesHasCoverColumn(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  listingId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("listing_images")
    .select("is_cover")
    .eq("listing_id", listingId)
    .limit(1);

  return !error || !isSchemaColumnError(error);
}

async function resolveListingPhotoStoragePath(image: {
  url: string;
  storage_path?: string | null;
}): Promise<string | null> {
  if (image.storage_path) return image.storage_path;
  return storagePathFromPublicUrl(image.url);
}

async function ensureSingleListingCover(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  listingId: string,
  coverImageId: string
) {
  const hasCoverColumn = await listingImagesHasCoverColumn(supabase, listingId);
  if (!hasCoverColumn) return;

  await supabase
    .from("listing_images")
    .update({ is_cover: false })
    .eq("listing_id", listingId)
    .neq("id", coverImageId);

  await supabase
    .from("listing_images")
    .update({ is_cover: true })
    .eq("id", coverImageId)
    .eq("listing_id", listingId);
}

async function countListingPhotos(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  listingId: string
): Promise<number> {
  return countSavedListingPhotos(supabase, listingId);
}

export async function getSavedListingImageCount(listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };
  const photoCount = await countSavedListingPhotos(auth.supabase, listingId);
  return { photoCount };
}

export async function getWizardListingDraft(listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error) return { error: toListingSaveError(error) };
  if (!data) return { error: "Η αγγελία δεν βρέθηκε." };

  const photoCount = await countSavedListingPhotos(auth.supabase, listingId);
  return { listing: data, photoCount };
}

/** @deprecated Use getSavedListingImageCount */
export async function getWizardListingPhotoCount(listingId: string) {
  return getSavedListingImageCount(listingId);
}

export async function getOwnerListingImages(listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { images, error } = await fetchOwnerListingImages(auth.supabase, listingId);
  if (error) return { error: toListingSaveError(error) };
  return { images: images ?? [] };
}

function parseListingFields(formData: FormData) {
  const city = formData.get("city") as string;
  const area = formData.get("area") as string;
  const address = (formData.get("address") as string) || undefined;
  const heatingType = (formData.get("heating_type") as string) || null;
  const energyClass = (formData.get("energy_class") as string) || null;
  let description = formData.get("description") as string;
  const houseRules = (formData.get("house_rules") as string)?.trim();
  if (houseRules) {
    description = `${description}\n\nΚανόνες σπιτιού:\n${houseRules}`;
  }
  const priceMonthlyRaw = formData.get("price_monthly") as string;
  const pricePerNightRaw = formData.get("price_per_night") as string;
  const price_monthly = priceMonthlyRaw
    ? parseInt(priceMonthlyRaw, 10)
    : pricePerNightRaw
      ? parseInt(pricePerNightRaw, 10)
      : 0;
  const price_per_night = pricePerNightRaw ? parseInt(pricePerNightRaw, 10) : null;

  return {
    city,
    area,
    address,
    title: formData.get("title") as string,
    description,
    description_en: (formData.get("description_en") as string)?.trim() || null,
    price_monthly,
    price_per_night,
    bedrooms: parseInt(formData.get("bedrooms") as string, 10),
    bathrooms: parseInt(formData.get("bathrooms") as string, 10) || null,
    sqm: parseInt(formData.get("sqm") as string, 10) || null,
    floor: parseInt(formData.get("floor") as string, 10) || null,
    total_floors: parseInt(formData.get("total_floors") as string, 10) || null,
    year_built: parseInt(formData.get("year_built") as string, 10) || null,
    year_renovated: parseInt(formData.get("year_renovated") as string, 10) || null,
    furnished: formData.get("furnished") === "on",
    has_balcony: formData.get("has_balcony") === "on",
    has_elevator: formData.get("has_elevator") === "on",
    heating_type: heatingType || null,
    energy_class: energyClass || null,
    utilities_included: formData.get("utilities_included") === "on",
    has_parking: formData.get("has_parking") === "on",
    pets_allowed: formData.get("pets_allowed") === "on",
    max_guests: parseInt(formData.get("max_guests") as string, 10) || null,
    cleaning_included: formData.get("cleaning_included") === "on",
    min_months: parseInt(formData.get("min_months") as string, 10) || 1,
    property_type: formData.get("property_type") as string,
  };
}

export async function savePortalListingDraft(
  formData: FormData,
  listingId?: string | null
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = parsePortalListingFields(formData);

  await ensureOwnerProfile(auth.supabase, auth.user);

  const draftFields = {
    ...fields,
    title: fields.title.trim() || "Πρόχειρη αγγελία",
    city: fields.city.trim() || "—",
    area: fields.area.trim() || fields.city.trim() || "—",
  };

  const verificationCode =
    draftFields.midora_verification_code ||
    `MIDORA-${Math.floor(10000 + Math.random() * 90000)}`;
  const row = buildPortalListingRow(
    draftFields,
    auth.user.id,
    verificationCode,
    "draft"
  );

  if (listingId) {
    const owner = await requireListingOwner(listingId);
    if ("error" in owner) return { error: owner.error };

    const { data, error } = await updateListingRow(
      owner.supabase,
      listingId,
      auth.user.id,
      row
    );

    if (error) return { error: toListingSaveError(error) };
    if (!data?.id) return { error: LISTING_SAVE_ERROR_MSG };
    revalidatePath("/dashboard");
    return { listingId: data.id };
  }

  if (draftFields.title && draftFields.title !== "Πρόχειρη αγγελία") {
    const { data: existingDraft } = await auth.supabase
      .from("listings")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("status", "pending")
      .eq("approval_status", "draft")
      .eq("title", draftFields.title)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraft?.id) {
      const { data, error } = await updateListingRow(
        auth.supabase,
        existingDraft.id,
        auth.user.id,
        row
      );
      if (error) return { error: toListingSaveError(error) };
      if (!data?.id) return { error: LISTING_SAVE_ERROR_MSG };
      revalidatePath("/dashboard");
      return { listingId: data.id };
    }
  }

  const { data, error } = await insertListingRow(auth.supabase, row, auth.user.id);

  if (error) return { error: toListingSaveError(error) };
  if (!data?.id) return { error: LISTING_SAVE_ERROR_MSG };

  await logAppEvent("listing_draft_saved", {
    userId: auth.user.id,
    entityType: "listing",
    entityId: data.id,
  });

  revalidatePath("/dashboard");
  return { listingId: data.id };
}

export async function submitPortalListingForReview(
  listingId: string,
  formData: FormData
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const fields = parsePortalListingFields(formData);

  const basicError = validateBasicDetails({
    title: fields.title,
    city: fields.city,
    area: fields.area,
    addressStreet: fields.address_street ?? "",
    addressNumber: fields.address_number ?? "",
    addressPostalCode: fields.address_postal_code ?? "",
    propertyType: fields.property_type,
    sqm: String(fields.sqm ?? ""),
    bedrooms: String(fields.bedrooms),
    bathrooms: fields.bathrooms != null ? String(fields.bathrooms) : "",
    floor: fields.floor != null ? String(fields.floor) : "",
    description: fields.description,
    forSubmission: true,
  });
  if (basicError) return { error: basicError };

  if (fields.title.length < MIN_LISTING_TITLE_LENGTH) {
    return {
      error: `Ο τίτλος πρέπει να έχει τουλάχιστον ${MIN_LISTING_TITLE_LENGTH} χαρακτήρες.`,
    };
  }
  if (fields.description.trim().length < MIN_LISTING_DESCRIPTION_LENGTH) {
    return {
      error: `Η περιγραφή πρέπει να έχει τουλάχιστον ${MIN_LISTING_DESCRIPTION_LENGTH} χαρακτήρες.`,
    };
  }

  const portalError = validatePortalListingFields(fields, { forSubmission: true });
  if (portalError) return { error: portalError };

  const photoCount = await countListingPhotos(auth.supabase, listingId);
  if (photoCount < MIN_LISTING_PHOTOS_FOR_REVIEW) {
    return {
      error: `Πρόσθεσε τουλάχιστον ${MIN_LISTING_PHOTOS_FOR_REVIEW} φωτογραφίες πριν την υποβολή.`,
    };
  }

  const { data: ownerProfile } = await auth.supabase
    .from("profiles")
    .select("phone, primary_phone_verified_at")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (fields.contact_phone) {
    const contactE164 = normalizePhoneToE164(fields.contact_phone);
    if (!contactE164 || !isValidGreekMobileE164(contactE164)) {
      return { error: "Συμπλήρωσε έγκυρο κινητό τηλέφωνο (Ελλάδα)." };
    }
    if (
      REQUIRE_LISTING_PHONE_SMS_VERIFICATION &&
      fields.allow_phone_contact &&
      !listingPhoneReadyForCalls(fields.contact_phone, true, ownerProfile)
    ) {
      return {
        error:
          "Επιβεβαίωσε τον αριθμό τηλεφώνου με SMS πριν την υποβολή (απαιτείται για κλήσεις).",
      };
    }
  } else if (!fields.contact_email?.trim() && !ownerProfile?.phone?.trim()) {
    return { error: "Συμπλήρωσε τηλέφωνο ή email επικοινωνίας." };
  }

  const verificationCode =
    fields.midora_verification_code ||
    `MIDORA-${Math.floor(10000 + Math.random() * 90000)}`;
  const row = buildPortalListingRow(
    fields,
    auth.user.id,
    verificationCode,
    "pending_review"
  );

  const { error } = await updateListingRow(
    auth.supabase,
    listingId,
    auth.user.id,
    {
      ...row,
      status: "pending",
      approval_status: "pending_review",
      declarations_submitted_at: new Date().toISOString(),
    }
  );

  if (error) return { error: toListingSaveError(error) };

  await logAppEvent("listing_submitted_for_review", {
    userId: auth.user.id,
    entityType: "listing",
    entityId: listingId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect(`/dashboard/listings?submitted=review`);
}

/** @deprecated Use savePortalListingDraft + submitPortalListingForReview */
export async function submitPortalListing(formData: FormData) {
  const draft = await savePortalListingDraft(formData);
  if (draft.error || !draft.listingId) return { error: draft.error };
  return submitPortalListingForReview(draft.listingId, formData);
}

export async function uploadWizardListingPhoto(
  listingId: string,
  formData: FormData
): Promise<{ image?: ListingImage; error?: string; successMessage?: string }> {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const file = formData.get("photo") as File | null;
  if (!file || file.size <= 0) {
    return { error: LISTING_PHOTO_UNSUPPORTED_MSG };
  }

  const mime = (file.type || "").toLowerCase();
  const ext = normalizeListingPhotoExtension(file.name, mime);
  if (!ext || !isAcceptedListingPhotoType(file.name, mime)) {
    return { error: LISTING_PHOTO_UNSUPPORTED_MSG };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      error: "Η φωτογραφία είναι πολύ μεγάλη. Επίλεξε αρχείο έως 10 MB.",
    };
  }

  const { data: existingMedia, error: existingError } =
    await fetchListingMediaForUpload(auth.supabase, listingId);

  if (existingError) {
    logListingImagePersistError(existingError, {
      storageUploadResult: null,
      listingId,
      ownerId: auth.user.id,
      fileName: file.name,
      mimeType: mime,
    });
    return {
      error: "Δεν ήταν δυνατή η αποθήκευση της φωτογραφίας στην αγγελία. Δοκίμασε ξανά.",
    };
  }

  const existingPhotos =
    existingMedia?.filter(
      (m) => !("media_type" in m) || (m as { media_type?: string }).media_type !== "video"
    ).length ?? 0;

  if (existingPhotos >= MAX_LISTING_PHOTOS) {
    return {
      error: `Μπορείς να ανεβάσεις έως ${MAX_LISTING_PHOTOS} φωτογραφίες ανά αγγελία.`,
    };
  }

  const sortOrder =
    (existingMedia?.reduce((max, m) => Math.max(max, m.sort_order ?? 0), -1) ?? -1) +
    1;

  const isCover = existingPhotos === 0;

  const fileId = randomUUID();
  const storagePath = `${auth.user.id}/${listingId}/${fileId}.${ext}`;
  const resolvedMime = mime || `image/${ext === "jpg" ? "jpeg" : ext}`;

  const { error: uploadError } = await auth.supabase.storage
    .from(LISTING_PHOTOS_BUCKET)
    .upload(storagePath, file, {
      contentType: resolvedMime,
      upsert: false,
    });

  if (uploadError) {
    logPhotoUploadDevError("storage", uploadError, {
      listing_id: listingId,
      owner_id: auth.user.id,
      file_name: file.name,
      mime_type: resolvedMime,
      size_bytes: file.size,
      storage_path: storagePath,
    });
    return {
      error: "Δεν ήταν δυνατή η μεταφόρτωση της φωτογραφίας. Δοκίμασε ξανά.",
    };
  }

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(storagePath);

  const { data: inserted, error: insertError } = await insertListingImageAfterUpload(
    auth.supabase,
    {
      listing_id: listingId,
      url: publicUrl,
      sort_order: sortOrder,
      media_type: "image",
    },
    {
      owner_id: auth.user.id,
      storage_path: storagePath,
      is_cover: isCover,
      file_name: file.name,
      mime_type: resolvedMime,
      size_bytes: file.size,
    }
  );

  if (insertError || !inserted) {
    await auth.supabase.storage.from(LISTING_PHOTOS_BUCKET).remove([storagePath]);
    logListingImagePersistError(insertError ?? { message: "no row returned" }, {
      storageUploadResult: { path: storagePath, ok: true },
      listingId,
      ownerId: auth.user.id,
      fileName: file.name,
      mimeType: resolvedMime,
    });
    return {
      error:
        "Δεν ήταν δυνατή η αποθήκευση της φωτογραφίας στην αγγελία. Δοκίμασε ξανά.",
    };
  }

  if (isCover) {
    await ensureSingleListingCover(auth.supabase, listingId, inserted.id);
    inserted.is_cover = true;
  }

  revalidatePath("/dashboard");
  return {
    image: inserted as ListingImage,
    successMessage: "Η φωτογραφία προστέθηκε στην αγγελία.",
  };
}

/** Upload one photo per call — used by legacy batch callers. */
export async function uploadWizardListingPhotos(
  listingId: string,
  formData: FormData
) {
  const photoFiles = formData.getAll("photos") as File[];
  const file = photoFiles.find((f) => f.size > 0);
  if (!file) {
    return { error: "Πρόσθεσε τουλάχιστον μία φωτογραφία." };
  }

  const single = new FormData();
  single.append("photo", file);
  const result = await uploadWizardListingPhoto(listingId, single);
  if (result.error) return { error: result.error };

  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const photoCount = await countListingPhotos(auth.supabase, listingId);
  return { success: true, photoCount };
}

export async function reorderListingPhotos(
  listingId: string,
  orderedImageIds: string[]
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  for (let i = 0; i < orderedImageIds.length; i++) {
    const { error } = await auth.supabase
      .from("listing_images")
      .update({ sort_order: i })
      .eq("id", orderedImageIds[i])
      .eq("listing_id", listingId);

    if (error) return { error: "Δεν ήταν δυνατή η αποθήκευση της σειράς. Δοκίμασε ξανά." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function setListingCoverPhoto(listingId: string, imageId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data: image } = await auth.supabase
    .from("listing_images")
    .select("id, media_type")
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .single();

  if (!image || image.media_type === "video") {
    return { error: "Η φωτογραφία δεν βρέθηκε." };
  }

  const hasCoverColumn = await listingImagesHasCoverColumn(auth.supabase, listingId);

  if (hasCoverColumn) {
    await ensureSingleListingCover(auth.supabase, listingId, imageId);
  } else {
    const { data: allImages } = await auth.supabase
      .from("listing_images")
      .select("id")
      .eq("listing_id", listingId)
      .neq("media_type", "video")
      .order("sort_order");

    if (allImages?.length) {
      const ordered = [
        imageId,
        ...allImages.filter((i) => i.id !== imageId).map((i) => i.id),
      ];
      await reorderListingPhotos(listingId, ordered);
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createListing(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = parseListingFields(formData);
  const coords = await geocodeAddress(fields.city, fields.area, fields.address);

  const { data: listing, error } = await auth.supabase
    .from("listings")
    .insert({
      user_id: auth.user.id,
      ...fields,
      availability_status: "available_now",
      availability_note: null,
      address: fields.address ?? null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAppEvent("listing_created", {
    userId: auth.user.id,
    entityType: "listing",
    entityId: listing.id,
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/listings/${listing.id}/photos`);
}

export async function updateListing(listingId: string, formData: FormData) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const fields = parseListingFields(formData);
  const coords = await geocodeAddress(fields.city, fields.area, fields.address);

  const { error } = await auth.supabase
    .from("listings")
    .update({
      ...fields,
      address: fields.address ?? null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      status: "pending",
    })
    .eq("id", listingId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  await logAppEvent("listing_updated", {
    userId: auth.user.id,
    entityType: "listing",
    entityId: listingId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/listings");
  revalidateListingsCatalog();
  redirect("/dashboard?updated=true");
}

/** Ενημέρωση διαθεσιμότητας χωρίς επαν-έγκριση */
export async function updateListingAvailability(listingId: string, formData: FormData) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const rawStatus = (formData.get("availability_status") as string)?.trim();
  const availabilityStatus = parseListingAvailabilityStatus(rawStatus);
  const availabilityNote =
    availabilityStatus === "from_month"
      ? (formData.get("availability_note") as string)?.trim() || null
      : null;

  if (availabilityStatus === "from_month" && !availabilityNote) {
    return { error: "Συμπλήρωσε από ποιον μήνα είναι διαθέσιμο." };
  }

  if (rawStatus && !isListingAvailabilityStatus(rawStatus)) {
    return { error: "Μη έγκυρη επιλογή διαθεσιμότητας." };
  }

  const { error } = await auth.supabase
    .from("listings")
    .update({
      availability_status: availabilityStatus,
      availability_note: availabilityNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/listings");
  revalidateListingsCatalog();
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function deleteListing(listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data: images } = await auth.supabase
    .from("listing_images")
    .select("url")
    .eq("listing_id", listingId);

  for (const image of images ?? []) {
    const path = storagePathFromPublicUrl(image.url);
    if (path) {
      await auth.supabase.storage.from("listing-photos").remove([path]);
    }
  }

  const { error } = await auth.supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/listings");
  revalidateListingsCatalog();
  redirect("/dashboard");
}

export async function deleteListingPhoto(listingId: string, imageId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data: image } = await auth.supabase
    .from("listing_images")
    .select("url, storage_path")
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .single();

  if (!image) return { error: "Η φωτογραφία δεν βρέθηκε." };

  const path = await resolveListingPhotoStoragePath(image);
  if (path) {
    await auth.supabase.storage.from(LISTING_PHOTOS_BUCKET).remove([path]);
  }

  const { error } = await auth.supabase
    .from("listing_images")
    .delete()
    .eq("id", imageId)
    .eq("listing_id", listingId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[listing-photo-delete]", error.message, { listingId, imageId });
    }
    return { error: "Δεν ήταν δυνατή η διαγραφή της φωτογραφίας. Δοκίμασε ξανά." };
  }

  const { data: nextCover } = await auth.supabase
    .from("listing_images")
    .select("id")
    .eq("listing_id", listingId)
    .neq("media_type", "video")
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (nextCover) {
    await ensureSingleListingCover(auth.supabase, listingId, nextCover.id);
  }

  revalidatePath(`/dashboard/listings/${listingId}/photos`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteListingPhotosBulk(
  listingId: string,
  imageIds: string[]
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const uniqueIds = [...new Set(imageIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { success: true };

  const { data: images } = await auth.supabase
    .from("listing_images")
    .select("id, url, storage_path")
    .eq("listing_id", listingId)
    .in("id", uniqueIds);

  if (!images?.length) return { error: "Δεν βρέθηκαν φωτογραφίες για διαγραφή." };

  const paths: string[] = [];
  for (const image of images) {
    const path = await resolveListingPhotoStoragePath(image);
    if (path) paths.push(path);
  }

  if (paths.length > 0) {
    await auth.supabase.storage.from(LISTING_PHOTOS_BUCKET).remove(paths);
  }

  const { error } = await auth.supabase
    .from("listing_images")
    .delete()
    .eq("listing_id", listingId)
    .in("id", images.map((i) => i.id));

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[listing-photo-bulk-delete]", error.message, {
        listingId,
        imageIds: uniqueIds,
      });
    }
    return { error: "Δεν ήταν δυνατή η διαγραφή των φωτογραφιών. Δοκίμασε ξανά." };
  }

  const { data: nextCover } = await auth.supabase
    .from("listing_images")
    .select("id")
    .eq("listing_id", listingId)
    .neq("media_type", "video")
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (nextCover) {
    await ensureSingleListingCover(auth.supabase, listingId, nextCover.id);
  }

  revalidatePath(`/dashboard/listings/${listingId}/photos`);
  revalidatePath("/dashboard");
  return { success: true, deleted: images.length };
}

export async function renewListingFree(listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error } = await auth.supabase
    .from("listings")
    .update({ status: "pending", expires_at: expiresAt.toISOString() })
    .eq("id", listingId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard?submitted=true");
}

export async function uploadListingPhotos(listingId: string, formData: FormData) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const photoFiles = formData.getAll("photos") as File[];
  const videoFile = formData.get("video") as File | null;
  const videoDuration = parseInt(String(formData.get("video_duration") ?? ""), 10);

  const validPhotos = photoFiles.filter((f) => f.size > 0);
  const hasVideo = videoFile && videoFile.size > 0;

  const { data: existingMedia } = await auth.supabase
    .from("listing_images")
    .select("media_type")
    .eq("listing_id", listingId);

  const existingCount = existingMedia?.length ?? 0;
  const existingVideos =
    existingMedia?.filter((m) => m.media_type === "video").length ?? 0;

  if (validPhotos.length === 0 && !hasVideo) {
    if (existingCount === 0) {
      return { error: "Πρόσθεσε τουλάχιστον 1 φωτογραφία ή βίντεο" };
    }
    redirect(`/dashboard/listings/${listingId}/pay`);
  }

  if (hasVideo) {
    if (!videoFile.type.startsWith("video/")) {
      return { error: "Το αρχείο βίντεο δεν είναι έγκυρο" };
    }
    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
      return { error: "Το βίντεο είναι πολύ μεγάλο (max 50MB)" };
    }
    if (
      !Number.isFinite(videoDuration) ||
      videoDuration <= 0 ||
      videoDuration > MAX_VIDEO_DURATION_SECONDS
    ) {
      return {
        error: `Το βίντεο πρέπει να είναι έως ${MAX_VIDEO_DURATION_SECONDS} δευτερόλεπτα`,
      };
    }
    if (existingVideos >= MAX_LISTING_VIDEOS) {
      return { error: "Μπορείς μόνο 1 βίντεο ανά αγγελία" };
    }
  }

  const photosToUpload = validPhotos.slice(0, MAX_LISTING_PHOTOS - existingCount);
  const slotsAfterPhotos = MAX_LISTING_PHOTOS - existingCount - photosToUpload.length;

  if (hasVideo && slotsAfterPhotos < 1) {
    return { error: "Δεν υπάρχει χώρος για βίντεο — μέγιστο 25 media" };
  }

  if (existingCount + photosToUpload.length + (hasVideo ? 1 : 0) > MAX_LISTING_PHOTOS) {
    return { error: `Μέγιστο ${MAX_LISTING_PHOTOS} αρχεία (φωτό + βίντεο)` };
  }

  let sortOrder = existingCount;

  for (let i = 0; i < photosToUpload.length; i++) {
    const file = photosToUpload[i];
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${auth.user.id}/${listingId}/${Date.now()}-photo-${i}.${ext}`;

    const { error: uploadError } = await auth.supabase.storage
      .from("listing-photos")
      .upload(path, file);

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = auth.supabase.storage.from("listing-photos").getPublicUrl(path);

    await auth.supabase.from("listing_images").insert({
      listing_id: listingId,
      url: publicUrl,
      sort_order: sortOrder++,
      media_type: "image",
    });
  }

  if (hasVideo && videoFile) {
    const ext = videoFile.name.split(".").pop() ?? "mp4";
    const path = `${auth.user.id}/${listingId}/${Date.now()}-video.${ext}`;

    const { error: uploadError } = await auth.supabase.storage
      .from("listing-photos")
      .upload(path, videoFile);

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = auth.supabase.storage.from("listing-photos").getPublicUrl(path);

    await auth.supabase.from("listing_images").insert({
      listing_id: listingId,
      url: publicUrl,
      sort_order: sortOrder,
      media_type: "video",
      duration_seconds: videoDuration,
    });
  }

  await logAppEvent("listing_image_uploaded", {
    userId: auth.user.id,
    entityType: "listing",
    entityId: listingId,
    metadata: { photoCount: photosToUpload.length, hasVideo },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/listings/${listingId}/pay`);
}

export async function approveListing(listingId: string): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const db = createServiceClient() ?? auth.supabase;

  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("*, listing_images(id, media_type)")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError || !listing) {
    return { error: "Η αγγελία δεν βρέθηκε." };
  }

  const {
    getListingApprovalChecklist,
    checklistBlockingMessage,
  } = await import("@/lib/admin/listing-approval-checklist");
  const checklist = await getListingApprovalChecklist(
    db,
    listing as import("@/lib/types").ListingWithImages
  );
  const blockMessage = checklistBlockingMessage(checklist);
  if (blockMessage) return { error: blockMessage };

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error: updateError } = await db
    .from("listings")
    .update({
      status: "approved",
      approval_status: "approved",
      expires_at: expiresAt.toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (updateError) return { error: updateError.message };

  if (listing.user_id) {
    await rewardReferrerForListingApproval(db, listing.user_id);
  }

  const { notifySavedSearchMatches } = await import("@/lib/notify-saved-searches");
  await notifySavedSearchMatches(listingId);

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/review");
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/listings");
  revalidateListingsCatalog();
  return {};
}

export async function rejectListing(
  listingId: string,
  adminReason?: string
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const reason = adminReason?.trim();
  if (!reason) {
    return { error: "Απαιτείται λόγος απόρριψης." };
  }

  const db = createServiceClient() ?? auth.supabase;
  const { error } = await db
    .from("listings")
    .update({
      status: "rejected",
      approval_status: "rejected",
      admin_verification_notes: reason,
    })
    .eq("id", listingId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/review");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function requestListingChanges(
  listingId: string,
  options?: { note?: string }
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const note = options?.note?.trim();
  if (!note) {
    return { error: "Συμπλήρωσε σημείωση προς τον αγγελιοδότη." };
  }

  const db = createServiceClient() ?? auth.supabase;

  const { error } = await db
    .from("listings")
    .update({
      approval_status: "needs_changes",
      status: "pending",
      admin_verification_notes: note,
    })
    .eq("id", listingId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/review");
  revalidatePath(`/admin/listings/${listingId}`);
  return {};
}

export async function submitListingReport(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Η αναφορά δεν είναι διαθέσιμη αυτή τη στιγμή." };
  }

  const listingId = (formData.get("listing_id") as string)?.trim();
  const reason = (formData.get("reason") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const reporterEmail = (formData.get("reporter_email") as string)?.trim() || null;

  if (!listingId || !reason) {
    return { error: "Συμπλήρωσε τον λόγο αναφοράς." };
  }

  const { error } = await supabase.from("listing_reports").insert({
    listing_id: listingId,
    reason,
    description,
    reporter_email: reporterEmail,
  });

  if (error) {
    console.error("[listing_reports]", error.message);
    // Graceful fallback if table not migrated yet
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { success: true };
    }
    return { error: "Δεν ήταν δυνατή η υποβολή. Δοκίμασε ξανά." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await logAppEvent("listing_reported", {
    userId: user?.id,
    entityType: "listing",
    entityId: listingId,
    metadata: { reason },
  });

  return { success: true };
}

// ─── Unavailable periods (informational only, not bookings) ─────────────────

function isMissingUnavailableTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function unavailablePeriodDbError(error: { code?: string; message?: string }): string {
  if (process.env.NODE_ENV === "development") {
    console.error("[saveUnavailablePeriod]", error);
  }
  if (isMissingUnavailableTable(error)) {
    return "Δεν ήταν δυνατή η αποθήκευση της περιόδου. Δοκίμασε ξανά.";
  }
  return error.message ?? "Δεν ήταν δυνατή η αποθήκευση της περιόδου. Δοκίμασε ξανά.";
}

async function saveUnavailablePeriodViaStorage(
  listingId: string,
  ownerId: string,
  startDate: string,
  endDate: string,
  reason: string | null,
  note: string | null,
  periodId: string | null,
  mergeIds: string[]
) {
  const { saveUnavailablePeriodToStorage } = await import(
    "@/lib/unavailable-periods-storage"
  );
  const periods = await saveUnavailablePeriodToStorage(listingId, ownerId, startDate, endDate, {
    periodId,
    reason,
    note,
    mergeIds,
  });
  if (!periods) {
    return { error: "Δεν ήταν δυνατή η αποθήκευση της περιόδου. Δοκίμασε ξανά." };
  }
  return { success: true as const, periods };
}

export async function saveUnavailablePeriod(formData: FormData) {
  const listingId = (formData.get("listing_id") as string)?.trim();
  const periodId = (formData.get("period_id") as string)?.trim() || null;
  let startDate = (formData.get("start_date") as string)?.trim();
  let endDate = (formData.get("end_date") as string)?.trim();
  const reason = (formData.get("reason") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;

  const forceOverlap = formData.get("force_overlap") === "true";

  if (!listingId || !startDate || !endDate) {
    return { error: "Συμπλήρωσε ημερομηνίες από και έως." };
  }
  if (endDate < startDate) {
    return {
      error:
        "Η ημερομηνία λήξης πρέπει να είναι ίδια ή μεταγενέστερη από την ημερομηνία έναρξης.",
    };
  }
  const { todayDateKey } = await import("@/lib/availability-calendar");
  if (endDate < todayDateKey()) {
    return { error: "Δεν μπορείς να δηλώσεις μη διαθεσιμότητα στο παρελθόν." };
  }

  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { getOwnerUnavailablePeriods } = await import("@/lib/unavailable-periods-db");
  const { findOverlappingPeriod, mergeUnavailableRange } = await import(
    "@/lib/unavailable-periods"
  );

  const existing = await getOwnerUnavailablePeriods(listingId, auth.user.id);
  const overlap = findOverlappingPeriod(existing, startDate, endDate, periodId ?? undefined);

  if (overlap && !forceOverlap) {
    return {
      overlapRequiresConfirm: true,
      overlapWarning: "Η περίοδος επικαλύπτεται με ήδη μη διαθέσιμες ημερομηνίες.",
    };
  }

  let mergeIds: string[] = [];
  if (overlap && forceOverlap) {
    const merged = mergeUnavailableRange(
      existing,
      startDate,
      endDate,
      periodId ?? undefined
    );
    startDate = merged.start;
    endDate = merged.end;
    mergeIds = merged.mergeIds.filter((id) => id !== periodId);
  }

  const payload = {
    listing_id: listingId,
    owner_id: auth.user.id,
    start_date: startDate,
    end_date: endDate,
    reason,
    note,
    updated_at: new Date().toISOString(),
  };

  if (mergeIds.length > 0) {
    const { error: deleteError } = await auth.supabase
      .from("listing_unavailable_periods")
      .delete()
      .in("id", mergeIds)
      .eq("owner_id", auth.user.id);

    if (deleteError && isMissingUnavailableTable(deleteError)) {
      const stored = await saveUnavailablePeriodViaStorage(
        listingId,
        auth.user.id,
        startDate,
        endDate,
        reason,
        note,
        periodId,
        mergeIds
      );
      if ("error" in stored) return stored;
      revalidatePath("/dashboard/listings");
      revalidatePath(`/dashboard/listings/${listingId}/edit`);
      revalidatePath(`/listings/${listingId}`);
      return { success: true, periods: stored.periods, merged: mergeIds.length > 0 };
    }
    if (deleteError) return { error: unavailablePeriodDbError(deleteError) };
  }

  let savedId = periodId;

  if (periodId) {
    const { error } = await auth.supabase
      .from("listing_unavailable_periods")
      .update(payload)
      .eq("id", periodId)
      .eq("owner_id", auth.user.id);

    if (error && isMissingUnavailableTable(error)) {
      const stored = await saveUnavailablePeriodViaStorage(
        listingId,
        auth.user.id,
        startDate,
        endDate,
        reason,
        note,
        periodId,
        mergeIds
      );
      if ("error" in stored) return stored;
      revalidatePath("/dashboard/listings");
      revalidatePath(`/dashboard/listings/${listingId}/edit`);
      revalidatePath(`/listings/${listingId}`);
      return { success: true, periods: stored.periods };
    }
    if (error) return { error: unavailablePeriodDbError(error) };
  } else {
    const { data, error } = await auth.supabase
      .from("listing_unavailable_periods")
      .insert(payload)
      .select("*")
      .single();

    if (error && isMissingUnavailableTable(error)) {
      const stored = await saveUnavailablePeriodViaStorage(
        listingId,
        auth.user.id,
        startDate,
        endDate,
        reason,
        note,
        null,
        mergeIds
      );
      if ("error" in stored) return stored;
      await logAppEvent("unavailable_period_created", {
        userId: auth.user.id,
        entityType: "listing",
        entityId: listingId,
        metadata: { startDate, endDate, storage: true },
      });
      revalidatePath("/dashboard/listings");
      revalidatePath(`/dashboard/listings/${listingId}/edit`);
      revalidatePath(`/listings/${listingId}`);
      return { success: true, periods: stored.periods, merged: mergeIds.length > 0 };
    }
    if (error) return { error: unavailablePeriodDbError(error) };

    savedId = data?.id ?? null;

    await logAppEvent("unavailable_period_created", {
      userId: auth.user.id,
      entityType: "listing",
      entityId: listingId,
      metadata: { startDate, endDate },
    });
  }

  const { data: refreshed } = await auth.supabase
    .from("listing_unavailable_periods")
    .select("*")
    .eq("listing_id", listingId)
    .eq("owner_id", auth.user.id)
    .order("start_date", { ascending: true });

  revalidatePath("/dashboard/listings");
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);

  return {
    success: true,
    period: savedId
      ? (refreshed ?? []).find((p) => p.id === savedId) ?? null
      : null,
    periods: refreshed ?? [],
    merged: mergeIds.length > 0,
  };
}

export async function deleteUnavailablePeriod(periodId: string, listingId: string) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from("listing_unavailable_periods")
    .delete()
    .eq("id", periodId)
    .eq("owner_id", auth.user.id);

  if (error && isMissingUnavailableTable(error)) {
    const { deleteUnavailablePeriodFromStorage } = await import(
      "@/lib/unavailable-periods-storage"
    );
    const periods = await deleteUnavailablePeriodFromStorage(listingId, periodId);
    if (!periods) {
      return { error: "Δεν ήταν δυνατή η αλλαγή. Δοκίμασε ξανά." };
    }
    revalidatePath("/dashboard/listings");
    revalidatePath(`/dashboard/listings/${listingId}/edit`);
    revalidatePath(`/listings/${listingId}`);
    return { success: true };
  }

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[deleteUnavailablePeriod]", error);
    }
    return { error: unavailablePeriodDbError(error) };
  }

  await logAppEvent("unavailable_period_deleted", {
    userId: auth.user.id,
    entityType: "unavailable_period",
    entityId: periodId,
    metadata: { listingId },
  });

  revalidatePath("/dashboard/listings");
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function updateListingLocation(
  listingId: string,
  latitude: number,
  longitude: number
) {
  const auth = await requireListingOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: "Μη έγκυρες συντεταγμένες." };
  }
  if (latitude < 34 || latitude > 42 || longitude < 19 || longitude > 30) {
    return { error: "Οι συντεταγμένες πρέπει να είναι εντός Ελλάδας." };
  }

  const patch: Record<string, unknown> = {
    latitude,
    longitude,
    location_confirmed_by_owner: true,
    location_pin_moved_manually: true,
    updated_at: new Date().toISOString(),
  };

  let { error } = await auth.supabase.from("listings").update(patch).eq("id", listingId);

  if (error?.message?.includes("location_confirmed_by_owner")) {
    ({ error } = await auth.supabase
      .from("listings")
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId));
  }

  if (error) return { error: error.message };

  revalidatePath("/dashboard/listings");
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function activateListingFree(listingId: string) {
  const supabase = await createClient();
  if (!supabase) {
    redirect(`/dashboard/listings/${listingId}/pay?error=config`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await supabase
    .from("listings")
    .update({ status: "pending", expires_at: expiresAt.toISOString() })
    .eq("id", listingId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard?submitted=true");
}

// ─── Saved searches ─────────────────────────────────────────────────────────

export async function saveSearch(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const name = (formData.get("name") as string)?.trim();
  const filtersJson = formData.get("filters") as string;
  if (!filtersJson) return { error: "Άκυρα φίλτρα" };

  let filters: Record<string, string>;
  try {
    filters = JSON.parse(filtersJson);
  } catch {
    return { error: "Άκυρα φίλτρα" };
  }

  const { buildSavedSearchName } = await import("@/lib/saved-searches");
  const finalName = name || buildSavedSearchName(filters);
  const emailAlerts = formData.get("email_alerts") !== "false";

  const insert: Record<string, unknown> = {
    user_id: auth.user.id,
    name: finalName,
    filters,
  };
  insert.email_alerts = emailAlerts;

  const { error } = await auth.supabase.from("saved_searches").insert(insert);

  if (error) {
    if (error.message.includes("saved_searches") || error.code === "42P01") {
      return { error: "Η λειτουργία αποθηκευμένων αναζητήσεων δεν είναι ενεργή ακόμα. Τρέξε το SQL migration στο Supabase." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/saved-searches");
  revalidatePath("/listings");
  revalidateListingsCatalog();
  return { success: true };
}

export async function updateSavedSearch(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const filtersJson = formData.get("filters") as string;

  const emailAlertsRaw = formData.get("email_alerts");
  const updates: {
    name?: string;
    filters?: Record<string, string>;
    email_alerts?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (name) updates.name = name;
  if (emailAlertsRaw === "true" || emailAlertsRaw === "false") {
    updates.email_alerts = emailAlertsRaw === "true";
  }
  if (filtersJson) {
    try {
      updates.filters = JSON.parse(filtersJson);
    } catch {
      return { error: "Άκυρα φίλτρα" };
    }
  }

  const { error } = await auth.supabase
    .from("saved_searches")
    .update(updates)
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/saved-searches");
  return { success: true };
}

export async function deleteSavedSearch(searchId: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  await auth.supabase
    .from("saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", auth.user.id);

  revalidatePath("/dashboard/saved-searches");
}

// ─── Favorites ──────────────────────────────────────────────────────────────

export async function toggleFavorite(listingId: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error, favorited: false };

  if (!listingId?.trim()) {
    return { error: "Άκυρη αγγελία", favorited: false };
  }

  const result = await toggleFavoriteForUser(auth.supabase, auth.user.id, listingId);
  if (result.error) return { error: result.error, favorited: result.favorited };

  revalidateFavoritePaths(revalidatePath);
  return { favorited: result.favorited };
}

export async function removeFavorite(listingId: string) {
  const auth = await requireUser();
  if ("error" in auth) return;

  const result = await removeFavoriteByIds(auth.supabase, auth.user.id, listingId);
  if (result.error) return;

  revalidateFavoritePaths(revalidatePath);
}

// ─── Property leads (interest, not booking) ─────────────────────────────────

export async function submitPropertyLead(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Η αποστολή δεν είναι διαθέσιμη αυτή τη στιγμή." };
  }

  const listingId = (formData.get("listing_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const timingNote = (formData.get("timing_note") as string)?.trim() || null;
  const duration = (formData.get("duration") as string)?.trim() || null;
  const message = (formData.get("message") as string)?.trim() || null;
  const interestStartDate =
    (formData.get("interest_start_date") as string)?.trim() || null;
  const interestEndDate =
    (formData.get("interest_end_date") as string)?.trim() || null;
  const interestStartMonth =
    (formData.get("interest_start_month") as string)?.trim() || null;
  const interestDurationRaw = (formData.get("interest_duration_months") as string)?.trim();
  const interestDurationMonths = interestDurationRaw
    ? parseInt(interestDurationRaw, 10)
    : null;
  const guestsRaw = (formData.get("guests") as string)?.trim();
  const guestsParsed = guestsRaw ? parseInt(guestsRaw, 10) : null;

  if (!listingId) return { error: "Άκυρη αγγελία." };
  if (!name) return { error: "Συμπλήρωσε το όνομά σου." };
  if (!email && !phone) {
    return { error: "Συμπλήρωσε email ή τηλέφωνο επικοινωνίας." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Το email δεν είναι έγκυρο." };
  }

  const listing = await getListingById(listingId);
  if (!listing || !isListingActive(listing)) {
    return { error: "Η αγγελία δεν είναι διαθέσιμη." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const guests =
    guestsParsed != null && Number.isFinite(guestsParsed) && guestsParsed > 0
      ? guestsParsed
      : null;
  const start_date = null;

  const { error } = await supabase.from("property_leads").insert({
    listing_id: listing.id,
    owner_id: listing.user_id,
    guest_id: user?.id ?? null,
    name,
    email,
    phone,
    start_date,
    timing_note: timingNote,
    duration,
    guests,
    message,
    interest_start_date: interestStartDate,
    interest_end_date: interestEndDate,
    interest_start_month: interestStartMonth,
    interest_duration_months:
      interestDurationMonths != null && Number.isFinite(interestDurationMonths)
        ? interestDurationMonths
        : null,
    status: "new",
  });

  if (error) return { error: mapLeadError(error) };

  await logAppEvent("contact_interest_sent", {
    userId: user?.id,
    entityType: "listing",
    entityId: listing.id,
  });

  revalidatePath("/dashboard/requests");
  return { success: true };
}

export async function updatePropertyLeadStatus(
  leadId: string,
  status: PropertyLeadStatus
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const allowed: PropertyLeadStatus[] = ["new", "read", "replied", "archived"];
  if (!allowed.includes(status)) return { error: "Άκυρη κατάσταση." };

  const { error } = await auth.supabase
    .from("property_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("owner_id", auth.user.id);

  if (error) return { error: mapLeadError(error) };

  revalidatePath("/dashboard/requests");
  return { success: true };
}
