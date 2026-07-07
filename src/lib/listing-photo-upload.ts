import {
  MAX_PHOTOS_PER_BATCH,
  MAX_PHOTO_SIZE_BYTES,
} from "@/lib/constants";

export const LISTING_PHOTOS_BUCKET = "listing-photos";

export const ACCEPTED_LISTING_PHOTO_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ACCEPTED_LISTING_PHOTO_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
] as const;

export const ACCEPTED_LISTING_PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

export const LISTING_PHOTO_UNSUPPORTED_MSG =
  "Το αρχείο δεν είναι υποστηριζόμενη εικόνα. Επίλεξε JPG, PNG, WEBP ή HEIC.";

export function normalizeListingPhotoExtension(
  fileName: string,
  mime: string
): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const normalizedMime = mime.toLowerCase();

  if (["jpg", "jpeg"].includes(ext) || normalizedMime === "image/jpeg" || normalizedMime === "image/jpg") {
    return "jpg";
  }
  if (ext === "png" || normalizedMime === "image/png") return "png";
  if (ext === "webp" || normalizedMime === "image/webp") return "webp";
  if (ext === "heic" || normalizedMime === "image/heic") return "heic";
  if (ext === "heif" || normalizedMime === "image/heif") return "heif";
  return null;
}

export function isAcceptedListingPhotoType(fileName: string, mime: string): boolean {
  return normalizeListingPhotoExtension(fileName, mime) !== null;
}

export type PhotoValidationError =
  | "unsupported_type"
  | "too_large"
  | "too_many"
  | "empty";

export function validateListingPhotoFile(
  file: File,
  batchIndex?: number
): { ok: true } | { ok: false; code: PhotoValidationError; message: string } {
  if (!file || file.size <= 0) {
    return {
      ok: false,
      code: "empty",
      message: LISTING_PHOTO_UNSUPPORTED_MSG,
    };
  }

  if (
    batchIndex !== undefined &&
    batchIndex >= MAX_PHOTOS_PER_BATCH
  ) {
    return {
      ok: false,
      code: "too_many",
      message: "Μπορείς να επιλέξεις έως 30 φωτογραφίες κάθε φορά.",
    };
  }

  const mime = file.type.toLowerCase();
  if (!isAcceptedListingPhotoType(file.name, mime)) {
    return {
      ok: false,
      code: "unsupported_type",
      message: LISTING_PHOTO_UNSUPPORTED_MSG,
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      code: "too_large",
      message: `Πολύ μεγάλο αρχείο (${sizeMb} MB). Το μέγιστο είναι 10 MB — επίλεξε μικρότερη εικόνα ή συμπίεσέ την.`,
    };
  }

  return { ok: true };
}

export function getListingPhotoValidationError(file: File): string | null {
  const result = validateListingPhotoFile(file);
  return result.ok ? null : result.message;
}

export function partitionListingPhotoFiles(files: File[]): {
  valid: File[];
  rejected: Array<{ file: File; message: string }>;
  globalErrors: string[];
} {
  const valid: File[] = [];
  const rejected: Array<{ file: File; message: string }> = [];
  const globalErrors: string[] = [];

  files.forEach((file, index) => {
    const result = validateListingPhotoFile(file, index);
    if (result.ok) {
      valid.push(file);
    } else {
      rejected.push({ file, message: result.message });
    }
  });

  if (files.length > MAX_PHOTOS_PER_BATCH) {
    globalErrors.push("Μπορείς να επιλέξεις έως 30 φωτογραφίες κάθε φορά.");
  }

  return {
    valid: valid.slice(0, MAX_PHOTOS_PER_BATCH),
    rejected,
    globalErrors,
  };
}

export function filterValidImageFiles(files: File[]): {
  valid: File[];
  errors: string[];
} {
  const valid: File[] = [];
  const errors: string[] = [];

  files.forEach((file, index) => {
    const result = validateListingPhotoFile(file, index);
    if (result.ok) {
      valid.push(file);
    } else if (!errors.includes(result.message)) {
      errors.push(result.message);
    }
  });

  if (files.length > MAX_PHOTOS_PER_BATCH) {
    errors.push("Μπορείς να επιλέξεις έως 30 φωτογραφίες κάθε φορά.");
  }

  return {
    valid: valid.slice(0, MAX_PHOTOS_PER_BATCH),
    errors,
  };
}
