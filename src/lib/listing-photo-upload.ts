import { pickLocale } from "@/lib/locale-fallbacks";
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

export const LISTING_PHOTO_ERROR_KEYS = {
  unsupportedType: "photoUnsupportedType",
  tooLarge: "photoTooLarge",
  tooMany: "photoTooMany",
  empty: "photoUnsupportedType",
} as const;

/** @deprecated Use `validateListingPhotoFile` with locale or `LISTING_PHOTO_ERROR_KEYS` */
export const LISTING_PHOTO_UNSUPPORTED_MSG =
  "Το αρχείο δεν είναι υποστηριζόμενη εικόνα. Επίλεξε JPG, PNG, WEBP ή HEIC.";

const LISTING_PHOTO_UNSUPPORTED_MSG_EN =
  "This file isn't a supported image. Choose JPG, PNG, WEBP, or HEIC.";

const LISTING_PHOTO_TOO_MANY_MSG = "Μπορείς να επιλέξεις έως 30 φωτογραφίες κάθε φορά.";
const LISTING_PHOTO_TOO_MANY_MSG_EN = "You can select up to 30 photos at a time.";

function tooLargeMessage(sizeMb: string, locale?: string): string {
  return pickLocale(
    locale,
    `Πολύ μεγάλο αρχείο (${sizeMb} MB). Το μέγιστο είναι 10 MB — επίλεξε μικρότερη εικόνα ή συμπίεσέ την.`,
    `File too large (${sizeMb} MB). Maximum is 10 MB — choose a smaller image or compress it.`
  );
}

function unsupportedMessage(locale?: string): string {
  return pickLocale(locale, LISTING_PHOTO_UNSUPPORTED_MSG, LISTING_PHOTO_UNSUPPORTED_MSG_EN);
}

function tooManyMessage(locale?: string): string {
  return pickLocale(locale, LISTING_PHOTO_TOO_MANY_MSG, LISTING_PHOTO_TOO_MANY_MSG_EN);
}

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

export function photoValidationErrorKey(code: PhotoValidationError): string {
  switch (code) {
    case "too_large":
      return LISTING_PHOTO_ERROR_KEYS.tooLarge;
    case "too_many":
      return LISTING_PHOTO_ERROR_KEYS.tooMany;
    default:
      return LISTING_PHOTO_ERROR_KEYS.unsupportedType;
  }
}

export function validateListingPhotoFile(
  file: File,
  batchIndex?: number,
  locale?: string
): { ok: true } | { ok: false; code: PhotoValidationError; message: string } {
  if (!file || file.size <= 0) {
    return {
      ok: false,
      code: "empty",
      message: unsupportedMessage(locale),
    };
  }

  if (
    batchIndex !== undefined &&
    batchIndex >= MAX_PHOTOS_PER_BATCH
  ) {
    return {
      ok: false,
      code: "too_many",
      message: tooManyMessage(locale),
    };
  }

  const mime = file.type.toLowerCase();
  if (!isAcceptedListingPhotoType(file.name, mime)) {
    return {
      ok: false,
      code: "unsupported_type",
      message: unsupportedMessage(locale),
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      code: "too_large",
      message: tooLargeMessage(sizeMb, locale),
    };
  }

  return { ok: true };
}

export function getListingPhotoValidationError(file: File, locale?: string): string | null {
  const result = validateListingPhotoFile(file, undefined, locale);
  return result.ok ? null : result.message;
}

export function partitionListingPhotoFiles(
  files: File[],
  locale?: string
): {
  valid: File[];
  rejected: Array<{ file: File; message: string }>;
  globalErrors: string[];
} {
  const valid: File[] = [];
  const rejected: Array<{ file: File; message: string }> = [];
  const globalErrors: string[] = [];

  files.forEach((file, index) => {
    const result = validateListingPhotoFile(file, index, locale);
    if (result.ok) {
      valid.push(file);
    } else {
      rejected.push({ file, message: result.message });
    }
  });

  if (files.length > MAX_PHOTOS_PER_BATCH) {
    globalErrors.push(tooManyMessage(locale));
  }

  return {
    valid: valid.slice(0, MAX_PHOTOS_PER_BATCH),
    rejected,
    globalErrors,
  };
}

export function filterValidImageFiles(files: File[], locale?: string): {
  valid: File[];
  errors: string[];
} {
  const valid: File[] = [];
  const errors: string[] = [];

  files.forEach((file, index) => {
    const result = validateListingPhotoFile(file, index, locale);
    if (result.ok) {
      valid.push(file);
    } else if (!errors.includes(result.message)) {
      errors.push(result.message);
    }
  });

  if (files.length > MAX_PHOTOS_PER_BATCH) {
    errors.push(tooManyMessage(locale));
  }

  return {
    valid: valid.slice(0, MAX_PHOTOS_PER_BATCH),
    errors,
  };
}
