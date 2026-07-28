"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LISTING_PLACEHOLDER_LABEL,
  resolveListingImageUrl,
} from "@/lib/listing-media";
import { cn } from "@/lib/utils";

type ImageItem = {
  url: string;
  media_type?: string | null;
};

type Props = {
  images: ImageItem[];
  alt: string;
  className?: string;
  imageClassName?: string;
  maxDots?: number;
  onImageClick?: () => void;
  index?: number;
  onIndexChange?: (index: number) => void;
  hidePlaceholderLabel?: boolean;
};

function ImagePlaceholder({
  className,
  hideLabel,
}: {
  className?: string;
  hideLabel?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sand/90 to-sand/60 text-muted",
        className
      )}
    >
      <ImageOff className="h-8 w-8 opacity-40" strokeWidth={1.5} />
      {!hideLabel && (
        <span className="mt-2 text-xs font-medium">{LISTING_PLACEHOLDER_LABEL}</span>
      )}
    </div>
  );
}

export function ListingImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  maxDots = 5,
  onImageClick,
  index: controlledIndex,
  onIndexChange,
  hidePlaceholderLabel = false,
}: Props) {
  const t = useTranslations("Listings.card");
  const photoUrls = images
    .filter((img) => img.media_type !== "video" && img.url?.trim())
    .map((img) => resolveListingImageUrl(img.url))
    .filter((url): url is string => Boolean(url));

  const hasPhotos = photoUrls.length > 0;
  const urls = hasPhotos ? photoUrls : [];
  const [internalIndex, setInternalIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const isControlled = controlledIndex !== undefined;
  const index = isControlled ? (controlledIndex ?? 0) : internalIndex;

  function setIndex(next: number) {
    if (!hasPhotos || next < 0 || next >= urls.length) return;
    if (!isControlled) setInternalIndex(next);
    onIndexChange?.(next);
  }

  const showPlaceholder = !hasPhotos || failed.has(index);
  const currentUrl = hasPhotos && !failed.has(index) ? urls[index] : null;
  const hasMultiple = urls.length > 1;
  const canPrev = index > 0;
  const canNext = index < urls.length - 1;

  function go(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex(index + delta);
  }

  function handleError() {
    setFailed((prev) => new Set(prev).add(index));
  }

  const arrowClass =
    "absolute top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-charcoal shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition hover:scale-105";

  return (
    <div
      className={cn("group/carousel relative h-full w-full overflow-hidden", className)}
    >
      {showPlaceholder ? (
        <div
          className={cn(onImageClick && "cursor-pointer")}
          onClick={onImageClick}
        >
          <ImagePlaceholder className={imageClassName} hideLabel={hidePlaceholderLabel} />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={currentUrl!}
          alt={alt}
          className={cn(imageClassName, onImageClick && "cursor-pointer")}
          onError={handleError}
          onClick={onImageClick}
        />
      )}

      {hasMultiple && !showPlaceholder && (
        <>
          <button
            type="button"
            onClick={(e) => canPrev && go(-1, e)}
            disabled={!canPrev}
            className={cn(
              arrowClass,
              "left-2",
              !canPrev && "cursor-default opacity-40 hover:scale-100"
            )}
            aria-label={t("previousPhotoAria")}
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5px]" />
          </button>
          <button
            type="button"
            onClick={(e) => canNext && go(1, e)}
            disabled={!canNext}
            className={cn(
              arrowClass,
              "right-2",
              !canNext && "cursor-default opacity-40 hover:scale-100"
            )}
            aria-label={t("nextPhotoAria")}
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5px]" />
          </button>
        </>
      )}

      {hasMultiple && !showPlaceholder && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {Array.from({ length: Math.min(urls.length, maxDots) }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index ? "bg-white" : "bg-white/55"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
