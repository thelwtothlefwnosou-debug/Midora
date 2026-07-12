"use client";

import { useState } from "react";
import { Grid2X2, Share2 } from "lucide-react";
import { ListingImageCarousel } from "@/components/listings/ListingImageCarousel";
import { GalleryImage } from "@/components/listings/GalleryImage";
import { ListingGalleryLightbox } from "@/components/listings/detail/ListingGalleryLightbox";
import type { ListingImage } from "@/lib/types";
import { resolveListingImageUrl } from "@/lib/listing-media";
import { sortListingPhotosForDisplay } from "@/lib/listing-photo-display";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

function GalleryPhoto({
  photo,
  title,
  alt,
  onClick,
  className,
  priority,
  sizes,
  overlay,
}: {
  photo: ListingImage;
  title: string;
  alt?: string;
  onClick: () => void;
  className?: string;
  priority?: boolean;
  sizes: string;
  overlay?: React.ReactNode;
}) {
  const src = resolveListingImageUrl(photo.url) ?? "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group relative block w-full overflow-hidden", className)}
      aria-label={alt ?? "Άνοιγμα φωτογραφίας"}
    >
      <GalleryImage
        src={src}
        alt={alt ?? title}
        className="transition-transform duration-500 group-hover:scale-[1.02]"
        sizes={sizes}
        priority={priority}
      />
      {overlay}
    </button>
  );
}

function ViewAllButton({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-charcoal transition-colors hover:border-gold/40",
        className
      )}
    >
      <Grid2X2 className="h-4 w-4 text-gold" />
      {COPY.viewAllPhotos}
      {count > 1 ? ` (${count})` : ""}
    </button>
  );
}

function DesktopGallery({
  photos,
  title,
  onOpen,
}: {
  photos: ListingImage[];
  title: string;
  onOpen: () => void;
}) {
  const count = photos.length;

  if (count === 0) {
    return (
      <div className="relative h-[460px] overflow-hidden rounded-[20px]">
        <ListingImageCarousel images={[]} alt={title} imageClassName="h-full w-full object-cover" />
      </div>
    );
  }

  if (count === 1) {
    return (
      <>
        <div className="relative h-[460px] overflow-hidden rounded-[20px]">
          <GalleryPhoto
            photo={photos[0]}
            title={title}
            onClick={onOpen}
            className="absolute inset-0"
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
          />
        </div>
      </>
    );
  }

  if (count === 2) {
    return (
      <div className="relative grid h-[460px] grid-cols-2 gap-2 overflow-hidden rounded-[20px]">
        {photos.slice(0, 2).map((photo, i) => (
          <GalleryPhoto
            key={photo.id}
            photo={photo}
            title={title}
            alt={`${title} — φωτογραφία ${i + 1}`}
            onClick={onOpen}
            className="h-full min-h-0"
            priority={i === 0}
            sizes="35vw"
          />
        ))}
        <ViewAllButton
          count={count}
          onClick={onOpen}
          className="absolute bottom-4 right-4 z-10 border-white/80 bg-white/95 shadow-md"
        />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="relative grid h-[460px] grid-cols-[1.2fr_1fr] gap-2 overflow-hidden rounded-[20px]">
        <GalleryPhoto
          photo={photos[0]}
          title={title}
          onClick={onOpen}
          className="h-full min-h-0"
          priority
          sizes="45vw"
        />
        <div className="grid min-h-0 grid-rows-2 gap-2">
          {photos.slice(1, 3).map((photo, i) => (
            <GalleryPhoto
              key={photo.id}
              photo={photo}
              title={title}
              alt={`${title} — φωτογραφία ${i + 2}`}
              onClick={onOpen}
              className="h-full min-h-0"
              sizes="25vw"
            />
          ))}
        </div>
        <ViewAllButton
          count={count}
          onClick={onOpen}
          className="absolute bottom-4 right-4 z-10 border-white/80 bg-white/95 shadow-md"
        />
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="relative grid h-[460px] grid-cols-[1.2fr_1fr] gap-2 overflow-hidden rounded-[20px]">
        <GalleryPhoto
          photo={photos[0]}
          title={title}
          onClick={onOpen}
          className="h-full min-h-0"
          priority
          sizes="45vw"
        />
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2">
          {photos.slice(1, 3).map((photo, i) => (
            <GalleryPhoto
              key={photo.id}
              photo={photo}
              title={title}
              alt={`${title} — φωτογραφία ${i + 2}`}
              onClick={onOpen}
              className="h-full min-h-0"
              sizes="20vw"
            />
          ))}
          <GalleryPhoto
            photo={photos[3]}
            title={title}
            alt={`${title} — φωτογραφία 4`}
            onClick={onOpen}
            className="col-span-2 h-full min-h-0"
            sizes="40vw"
          />
        </div>
        <ViewAllButton
          count={count}
          onClick={onOpen}
          className="absolute bottom-4 right-4 z-10 border-white/80 bg-white/95 shadow-md"
        />
      </div>
    );
  }

  const sidePhotos = photos.slice(1, 5);
  const extraCount = Math.max(0, count - 5);

  return (
    <>
      <div className="relative grid h-[460px] grid-cols-[1.2fr_1fr] gap-2 overflow-hidden rounded-[20px]">
        <GalleryPhoto
          photo={photos[0]}
          title={title}
          onClick={onOpen}
          className="h-full min-h-0"
          priority
          sizes="45vw"
        />
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2">
          {sidePhotos.map((photo, i) => {
            const photoIndex = i + 1;
            const isLast = i === sidePhotos.length - 1 && extraCount > 0;
            return (
              <GalleryPhoto
                key={photo.id}
                photo={photo}
                title={title}
                alt={`${title} — φωτογραφία ${photoIndex + 1}`}
                onClick={onOpen}
                className="h-full min-h-0"
                sizes="20vw"
                overlay={
                  isLast ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-charcoal/55 text-sm font-semibold text-white">
                      +{extraCount} {extraCount === 1 ? "φωτογραφία" : "φωτογραφίες"}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>
        {count > 1 && (
          <ViewAllButton
            count={count}
            onClick={onOpen}
            className="absolute bottom-4 right-4 z-10 border-white/80 bg-white/95 shadow-md"
          />
        )}
      </div>
    </>
  );
}

export function ListingMediaGallery({
  images,
  title,
  favoriteSlot,
  onShare,
  mobileActions,
}: {
  images: ListingImage[];
  title: string;
  favoriteSlot?: React.ReactNode;
  onShare?: () => void;
  /** Share / save / more circles on mobile carousel */
  mobileActions?: React.ReactNode;
}) {
  const sorted = sortListingPhotosForDisplay(images);
  const photos = sorted;
  const videos = [...images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((item) => item.media_type === "video");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function openLightbox() {
    setLightboxOpen(true);
  }

  const galleryPhotos = photos.filter((p) => resolveListingImageUrl(p.url));
  const hasRealPhotos = galleryPhotos.length > 0;

  const overlayActions = mobileActions ?? (favoriteSlot || onShare) ? (
    mobileActions ? (
      <div className="absolute right-3 top-3 z-20">{mobileActions}</div>
    ) : (
      <div className="absolute right-3 top-3 z-20 flex gap-2">
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal shadow-sm"
            aria-label="Κοινοποίηση"
          >
            <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        )}
        {favoriteSlot}
      </div>
    )
  ) : null;

  return (
    <>
      {/* Mobile: swipeable carousel */}
      <div className="relative lg:hidden">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          {overlayActions}
          {hasRealPhotos && (
            <span className="absolute bottom-3 left-3 z-20 rounded-full bg-charcoal/70 px-2.5 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {galleryPhotos.length}
            </span>
          )}
          <ListingImageCarousel
            images={galleryPhotos}
            alt={title}
            imageClassName="h-full w-full object-cover"
            maxDots={8}
            index={activeIndex}
            onIndexChange={setActiveIndex}
            onImageClick={() => hasRealPhotos && openLightbox()}
          />
        </div>
        {hasRealPhotos && galleryPhotos.length > 1 && (
          <ViewAllButton
            count={galleryPhotos.length}
            onClick={openLightbox}
            className="mt-3 flex min-h-11 w-full justify-center"
          />
        )}
      </div>

      {/* Desktop: adaptive layout */}
      <div className="relative hidden lg:block">
        <DesktopGallery
          photos={galleryPhotos}
          title={title}
          onOpen={openLightbox}
        />
      </div>

      {videos.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {videos.map((item) => (
            <div key={item.id} className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video
                src={item.url}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                Βίντεο {item.duration_seconds ? `${item.duration_seconds}s` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {lightboxOpen && hasRealPhotos && (
        <ListingGalleryLightbox
          photos={galleryPhotos}
          title={title}
          onClose={() => setLightboxOpen(false)}
          onShare={onShare}
          favoriteSlot={favoriteSlot}
        />
      )}
    </>
  );
}
