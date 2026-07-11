"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  availableGalleryFilters,
  filterPhotosByGalleryTab,
  filterPhotosByRoomKey,
  PHOTO_GALLERY_FILTERS,
  sortListingPhotosForDisplay,
  type PhotoGalleryFilterId,
} from "@/lib/listing-photo-display";
import { resolveListingImageUrl } from "@/lib/listing-media";
import type { ListingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  photos: ListingImage[];
  title: string;
  startIndex: number;
  onClose: () => void;
  initialFilter?: PhotoGalleryFilterId;
  roomKeyFilter?: string | null;
};

export function ListingGalleryLightbox({
  photos,
  title,
  startIndex,
  onClose,
  initialFilter = "all",
  roomKeyFilter = null,
}: Props) {
  const sorted = useMemo(() => sortListingPhotosForDisplay(photos), [photos]);
  const [filter, setFilter] = useState<PhotoGalleryFilterId>(initialFilter);
  const tabs = useMemo(() => availableGalleryFilters(sorted), [sorted]);

  const filtered = useMemo(() => {
    if (roomKeyFilter) return filterPhotosByRoomKey(sorted, roomKeyFilter);
    return filterPhotosByGalleryTab(sorted, filter);
  }, [sorted, filter, roomKeyFilter]);

  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, filtered.length - 1))
  );

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, filtered.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, filtered.length]);

  const current = filtered[index];
  const src = resolveListingImageUrl(current?.url) ?? current?.url ?? "";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-charcoal/95">
      <div className="border-b border-white/10 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold">Όλες οι φωτογραφίες</p>
            <p className="text-xs text-white/70">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {tabs.length > 1 && !roomKeyFilter && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {PHOTO_GALLERY_FILTERS.filter((t) => tabs.includes(t.id)).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.id
                    ? "bg-white text-charcoal"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex-1">
        {filtered.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow disabled:opacity-40"
              aria-label="Προηγούμενη"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(i + 1, filtered.length - 1))}
              disabled={index === filtered.length - 1}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow disabled:opacity-40"
              aria-label="Επόμενη"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        {current && (
          <div className="relative h-full w-full">
            <Image
              src={src}
              alt={current.caption ?? `${title} — φωτογραφία ${index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3 text-center text-sm text-white/80">
        {filtered.length > 0 ? `${index + 1} / ${filtered.length}` : "Δεν υπάρχουν φωτογραφίες"}
        {current?.caption && (
          <p className="mt-1 text-xs text-white/60">{current.caption}</p>
        )}
      </div>
    </div>
  );
}
