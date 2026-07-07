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
  console.error(
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

export function photoCountStatusMessage(savedCount: number): string {
  if (savedCount < MIN_LISTING_PHOTOS_REQUIRED) {
    return "Πρόσθεσε τουλάχιστον μία φωτογραφία του ακινήτου για να συνεχίσεις.";
  }
  if (savedCount >= MIN_LISTING_PHOTOS_FOR_REVIEW) {
    return `${savedCount} αποθηκευμένες φωτογραφίες — έτοιμο για υποβολή.`;
  }
  const remaining = MIN_LISTING_PHOTOS_FOR_REVIEW - savedCount;
  return `${savedCount} αποθηκευμένες φωτογραφίες — απομένουν ${remaining} για υποβολή.`;
}

export function photoCountStepError(savedCount: number): string | null {
  if (savedCount >= MIN_LISTING_PHOTOS_REQUIRED) return null;
  return "Πρόσθεσε τουλάχιστον μία φωτογραφία του ακινήτου για να συνεχίσεις.";
}

export function photoCountSubmitError(savedCount: number): string | null {
  if (savedCount >= MIN_LISTING_PHOTOS_FOR_REVIEW) return null;
  return "Πρόσθεσε τουλάχιστον 5 φωτογραφίες για να υποβάλεις την αγγελία για έλεγχο.";
}
