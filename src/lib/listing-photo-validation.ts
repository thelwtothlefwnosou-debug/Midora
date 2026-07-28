import {
  MIN_LISTING_PHOTOS_FOR_REVIEW,
  MIN_LISTING_PHOTOS_REQUIRED,
} from "@/lib/constants";

export function logListingImageValidationDebug(meta: {
  listingId: string | null;
  savedImageCount: number;
  localPhotoCount?: number;
  pendingUploads?: number;
  failedUploads?: number;
  currentStep?: number;
}) {
  if (process.env.NODE_ENV !== "development") return;
  // Use debug (not error) so Next.js/Turbopack does not show a full-screen overlay.
  console.debug(
    "LISTING_IMAGE_VALIDATION_DEBUG",
    JSON.stringify(
      {
        listingId: meta.listingId,
        savedImageCount: meta.savedImageCount,
        localPhotoCount: meta.localPhotoCount ?? null,
        pendingUploads: meta.pendingUploads ?? null,
        failedUploads: meta.failedUploads ?? null,
        currentStep: meta.currentStep ?? null,
      },
      null,
      2
    )
  );
}

export type PhotoCountStatusInfo = {
  key: "photoStatusNeedOne" | "photoStatusReady" | "photoStatusRemaining";
  params?: { count: number; remaining?: number };
};

/** Returns Wizard.photos message key + params for the status line. */
export function photoCountStatusInfo(savedCount: number): PhotoCountStatusInfo {
  if (savedCount < MIN_LISTING_PHOTOS_REQUIRED) {
    return { key: "photoStatusNeedOne" };
  }
  if (savedCount >= MIN_LISTING_PHOTOS_FOR_REVIEW) {
    return { key: "photoStatusReady", params: { count: savedCount } };
  }
  const remaining = MIN_LISTING_PHOTOS_FOR_REVIEW - savedCount;
  return {
    key: "photoStatusRemaining",
    params: { count: savedCount, remaining },
  };
}

export function photoCountStepError(savedCount: number): string | null {
  if (savedCount >= MIN_LISTING_PHOTOS_REQUIRED) return null;
  return "photoMinOne";
}

export function photoCountSubmitError(savedCount: number): string | null {
  if (savedCount >= MIN_LISTING_PHOTOS_FOR_REVIEW) return null;
  return "photoMinForReview";
}
