"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  groupImagesByRoom,
  suggestPhotoRooms,
} from "@/lib/photo-rooms-catalog";
import type { ListingImage, ListingPublicDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: Pick<ListingPublicDetail, "bedrooms" | "bathrooms">;
  images: ListingImage[];
};

export function ListingPhotoTourSection({ listing, images }: Props) {
  const rooms = useMemo(
    () => suggestPhotoRooms({ bedrooms: listing.bedrooms, bathrooms: listing.bathrooms }),
    [listing.bedrooms, listing.bathrooms]
  );

  const grouped = useMemo(
    () => groupImagesByRoom(images, rooms),
    [images, rooms]
  );

  const [activeRoom, setActiveRoom] = useState<string>(grouped[0]?.room.key ?? "");
  const [photoIndex, setPhotoIndex] = useState(0);

  const activeGroup = grouped.find((g) => g.room.key === activeRoom) ?? grouped[0];
  const activePhotos = activeGroup?.images ?? [];

  if (grouped.length === 0) return null;

  function selectRoom(key: string) {
    setActiveRoom(key);
    setPhotoIndex(0);
  }

  const currentPhoto = activePhotos[photoIndex];

  return (
    <section id="photo-tour" className="listing-section scroll-mt-32">
      <h2 className="listing-section-title">Περιήγηση σπιτιού</h2>
      <p className="listing-meta mt-2">
        Δες κάθε χώρο ξεχωριστά — όπως θα ήταν μια ξενάγηση στο ακίνητο.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {grouped.map(({ room, images: roomImages }) => (
          <button
            key={room.key}
            type="button"
            onClick={() => selectRoom(room.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeRoom === room.key
                ? "bg-charcoal text-white"
                : "bg-sand text-charcoal/80 hover:bg-sand/80"
            )}
          >
            {room.label}
            <span className="ml-1.5 text-xs opacity-70">({roomImages.length})</span>
          </button>
        ))}
      </div>

      {currentPhoto && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
          <div className="relative aspect-[16/10] bg-sand/30">
            <Image
              src={currentPhoto.url}
              alt={activeGroup.room.label}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority={photoIndex === 0}
            />
            {activePhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoIndex((i) => (i === 0 ? activePhotos.length - 1 : i - 1))
                  }
                  className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md"
                  aria-label="Προηγούμενη"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoIndex((i) => (i === activePhotos.length - 1 ? 0 : i + 1))
                  }
                  className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md"
                  aria-label="Επόμενη"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="font-medium text-charcoal">{activeGroup.room.label}</p>
            {activePhotos.length > 1 && (
              <p className="text-sm text-muted">
                {photoIndex + 1} / {activePhotos.length}
              </p>
            )}
          </div>

          {activePhotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-3">
              {activePhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  className={cn(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2",
                    idx === photoIndex ? "border-gold" : "border-transparent opacity-70"
                  )}
                >
                  <Image src={photo.url} alt="" fill className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
