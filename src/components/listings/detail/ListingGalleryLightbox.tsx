"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  availableGalleryFilters,
  filterPhotosByGalleryTab,
  photoGalleryFilterLabel,
  sortListingPhotosForDisplay,
  type PhotoGalleryFilterId,
} from "@/lib/listing-photo-display";
import { resolveListingImageUrl } from "@/lib/listing-media";
import type { ListingImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  photos: ListingImage[];
  title: string;
  onClose: () => void;
  onShare?: () => void;
  favoriteSlot?: React.ReactNode;
  initialFilter?: PhotoGalleryFilterId;
};

export function ListingGalleryLightbox({
  photos,
  title,
  onClose,
  onShare,
  favoriteSlot,
  initialFilter = "all",
}: Props) {
  const t = useTranslations("Listing");
  const tGallery = useTranslations("Listing.gallery");
  const locale = useLocale();
  const sorted = useMemo(() => sortListingPhotosForDisplay(photos), [photos]);
  const [filter, setFilter] = useState<PhotoGalleryFilterId>(initialFilter);
  const tabs = useMemo(() => availableGalleryFilters(sorted), [sorted]);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  const filtered = useMemo(
    () => filterPhotosByGalleryTab(sorted, filter),
    [sorted, filter]
  );

  const groupedSections = useMemo(() => {
    if (filter !== "all") {
      return [
        {
          id: filter,
          label: photoGalleryFilterLabel(filter, locale),
          photos: filtered,
        },
      ];
    }

    const hasRooms = tabs.length > 1;
    if (!hasRooms) {
      return [{ id: "all", label: tGallery("allPhotos"), photos: sorted }];
    }

    return tabs
      .filter((id) => id !== "all")
      .map((id) => ({
        id,
        label: photoGalleryFilterLabel(id, locale),
        photos: filterPhotosByGalleryTab(sorted, id),
      }));
  }, [filter, filtered, sorted, tabs, locale, tGallery]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleTabClick(id: PhotoGalleryFilterId) {
    setFilter(id);
    if (id === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = sectionRefs.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-charcoal/8 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-charcoal transition-colors hover:bg-charcoal/[0.04]"
              aria-label={tGallery("closeAria")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-charcoal">{t("photos")}</p>
              <p className="truncate text-xs text-muted">{title}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onShare ? (
              <button
                type="button"
                onClick={onShare}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-charcoal/75 transition-colors hover:bg-charcoal/[0.04] hover:text-charcoal"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("share")}</span>
              </button>
            ) : null}
            {favoriteSlot}
          </div>
        </div>

        {tabs.length > 1 && (
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
            {tabs.map((tabId) => (
              <button
                key={tabId}
                type="button"
                onClick={() => handleTabClick(tabId)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  filter === tabId
                    ? "bg-charcoal text-white"
                    : "bg-sand/60 text-charcoal/75 hover:bg-sand"
                )}
              >
                {tabId === "all" ? tGallery("allPhotos") : photoGalleryFilterLabel(tabId, locale)}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {groupedSections.map((section) => (
            <section
              key={section.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(section.id, el);
                else sectionRefs.current.delete(section.id);
              }}
              className="scroll-mt-36 not-first:mt-10"
            >
              <h2 className="font-display text-lg font-semibold text-charcoal sm:text-xl">
                {section.id === "all" ? tGallery("allPhotos") : section.label}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.photos.map((photo, index) => {
                  const src = resolveListingImageUrl(photo.url) ?? photo.url;
                  return (
                    <figure
                      key={photo.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand/30"
                    >
                      <Image
                        src={src}
                        alt={photo.caption ?? `${title} — ${section.label} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      {photo.caption ? (
                        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/70 to-transparent px-3 py-2 text-xs text-white">
                          {photo.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-muted">{tGallery("emptyCategory")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
