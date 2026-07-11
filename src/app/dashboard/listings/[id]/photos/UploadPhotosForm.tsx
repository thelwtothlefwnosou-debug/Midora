"use client";

import { ListingPhotoManager } from "@/components/dashboard/photos/ListingPhotoManager";
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

export function UploadPhotosForm({
  listing,
  existingImages,
  sleepingArrangements,
}: Props) {
  return (
    <ListingPhotoManager
      listing={listing}
      existingImages={existingImages}
      sleepingArrangements={sleepingArrangements}
    />
  );
}
