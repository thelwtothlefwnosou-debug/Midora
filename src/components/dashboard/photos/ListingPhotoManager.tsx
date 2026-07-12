"use client";

import { useMemo, useRef } from "react";
import { Upload } from "lucide-react";
import { ListingWizardPhotosStep } from "@/components/listings/wizard/ListingWizardPhotosStep";
import { ListingPublicGalleryPreview } from "@/components/dashboard/photos/ListingPublicGalleryPreview";
import { ListingHouseTourPanel } from "@/components/dashboard/photos/ListingHouseTourPanel";
import { ListingArrivalEditor } from "@/components/dashboard/ListingArrivalEditor";
import { ListingVideoUploadCard } from "@/components/dashboard/ListingVideoUploadCard";
import {
  firstFiveRoomWarning,
  isCoverPhoto,
  photoManagerSummary,
  sortListingPhotosForDisplay,
} from "@/lib/listing-photo-display";
import { suggestPhotoRooms } from "@/lib/photo-rooms-catalog";
import { listingRentalType } from "@/lib/rental-types";
import { getListingPublicId } from "@/lib/utils";
import type {
  ListingImage,
  ListingSleepingArrangement,
  ListingWithImages,
} from "@/lib/types";

type Props = {
  listing: ListingWithImages;
  existingImages: ListingImage[];
  sleepingArrangements: ListingSleepingArrangement[];
};

export function ListingPhotoManager({
  listing,
  existingImages,
  sleepingArrangements,
}: Props) {
  const uploadRef = useRef<HTMLDivElement>(null);
  const isShortTerm = listingRentalType(listing) === "short_term";
  const publicId = getListingPublicId(listing);

  const rooms = useMemo(
    () => suggestPhotoRooms({ bedrooms: listing.bedrooms, bathrooms: listing.bathrooms }),
    [listing.bedrooms, listing.bathrooms]
  );

  const photos = useMemo(
    () => sortListingPhotosForDisplay(existingImages),
    [existingImages]
  );

  const summary = useMemo(
    () => photoManagerSummary(existingImages, rooms),
    [existingImages, rooms]
  );

  const roomWarning = useMemo(() => firstFiveRoomWarning(existingImages), [existingImages]);
  const hasCover = photos.some((p, i) => isCoverPhoto(p, i));

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-border bg-white px-4 py-3 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-charcoal">Φωτογραφίες</h2>
            <p className="mt-0.5 text-xs text-muted">
              Εξώφυλλο, σειρά, χώροι — αποθηκεύονται αμέσως.
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToUpload}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-charcoal px-3.5 text-sm font-semibold text-white hover:bg-charcoal/90"
          >
            <Upload className="h-4 w-4" />
            Ανέβασε
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryChip label="Φωτογραφίες" value={String(summary.total)} />
          <SummaryChip label="Εξώφυλλο" value={summary.coverCount ? "1" : "—"} />
          <SummaryChip label="Χώροι με φωτό" value={String(summary.roomsWithPhotos)} />
          <SummaryChip label="Χωρίς χώρο" value={String(summary.unassigned)} />
        </div>

        {!hasCover && summary.total > 0 && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Επίλεξε φωτογραφία εξωφύλλου για να εμφανίζεται σωστά η αγγελία.
          </p>
        )}
      </header>

      <ListingPublicGalleryPreview
        images={existingImages}
        publicHref={`/listings/${publicId}`}
        roomWarning={roomWarning}
      />

      <div ref={uploadRef}>
        <ListingWizardPhotosStep
          listingId={listing.id}
          initialImages={existingImages}
          variant="manager"
          rooms={rooms}
          hideHeading
        />
      </div>

      <ListingHouseTourPanel
        listing={listing}
        images={existingImages}
        sleepingArrangements={sleepingArrangements}
      />

      {isShortTerm && <ListingArrivalEditor listing={listing} />}

      <ListingVideoUploadCard listingId={listing.id} existingImages={existingImages} />
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-sand/20 px-4 py-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-charcoal">
        {value}
      </p>
    </div>
  );
}
