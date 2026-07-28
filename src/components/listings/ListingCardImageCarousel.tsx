"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  collectListingCardPhotoUrls,
  isolateCarouselControlEvent,
  resolveCarouselActiveDotIndex,
  resolveCarouselDotCount,
  resolveCarouselSwipeDirection,
  stepCarouselIndex,
  type ListingCardPhotoInput,
} from "@/lib/listing-card-photos";
import { cn } from "@/lib/utils";

type Props = {
  images: ListingCardPhotoInput[] | null | undefined;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  /** dark = home cards; light = search cards (white arrow pills). */
  variant?: "dark" | "light";
};

export function ListingCardImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  variant = "dark",
}: Props) {
  const t = useTranslations("Listings.card");
  // No photo cap: arrows/swipe walk every image; dots stay capped at 5.
  const urls = collectListingCardPhotoUrls(images, { max: null });
  const urlsKey = urls.join("\0");
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [syncedUrlsKey, setSyncedUrlsKey] = useState(urlsKey);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  // Reset carousel when photo set changes (render-time adjust; avoids setState-in-effect).
  if (urlsKey !== syncedUrlsKey) {
    setSyncedUrlsKey(urlsKey);
    setIndex(0);
    setFailed(new Set());
  }

  const count = urls.length;
  const hasMultiple = count > 1;
  const safeIndex =
    count > 0 ? Math.min(((index % count) + count) % count, count - 1) : 0;
  const currentUrl = count > 0 && !failed.has(safeIndex) ? urls[safeIndex] : null;
  const showPlaceholder = count === 0 || !currentUrl;
  const dotCount = resolveCarouselDotCount(count);
  const activeDot = resolveCarouselActiveDotIndex(safeIndex, count);
  const showDots = dotCount > 0;

  useEffect(() => {
    if (!hasMultiple) return;
    const nextUrl = urls[stepCarouselIndex(safeIndex, count, 1)];
    if (!nextUrl) return;
    const preload = new window.Image();
    preload.src = nextUrl;
  }, [hasMultiple, urlsKey, safeIndex, count, urls]);

  function go(delta: number) {
    if (!hasMultiple) return;
    setIndex((prev) => stepCarouselIndex(prev, count, delta));
  }

  function onControlClick(delta: number, event: React.MouseEvent | React.KeyboardEvent) {
    isolateCarouselControlEvent(event);
    go(delta);
  }

  function onPointerDown(event: React.PointerEvent) {
    if (!hasMultiple) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: React.PointerEvent) {
    if (!hasMultiple || !pointerStart.current) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    const direction = resolveCarouselSwipeDirection(deltaX, deltaY);
    if (!direction) return;

    isolateCarouselControlEvent(event);
    suppressClickRef.current = true;
    go(direction === "next" ? 1 : -1);
  }

  function onPointerCancel() {
    pointerStart.current = null;
  }

  function onClickCapture(event: React.MouseEvent) {
    if (!suppressClickRef.current) return;
    isolateCarouselControlEvent(event);
    suppressClickRef.current = false;
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!hasMultiple) return;
    if (event.key === "ArrowLeft") {
      onControlClick(-1, event);
    } else if (event.key === "ArrowRight") {
      onControlClick(1, event);
    }
  }

  // Search cards: always visible (hover-only was unreliable). Home: soft until hover.
  const controlVisibility =
    variant === "light"
      ? "opacity-100"
      : "opacity-100 md:opacity-0 md:group-hover/card:opacity-100 md:group-focus-within/carousel:opacity-100";

  const arrowClass = cn(
    "absolute top-1/2 z-[35] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full sm:h-9 sm:w-9",
    "pointer-events-auto transition-[opacity,background-color,transform] hover:scale-105",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    controlVisibility,
    variant === "light"
      ? "bg-white/95 text-charcoal shadow-[0_1px_4px_rgba(0,0,0,0.18)] hover:bg-white focus-visible:ring-charcoal/30 focus-visible:ring-offset-white/40"
      : "bg-black/45 text-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] backdrop-blur-[2px] hover:bg-black/60 focus-visible:ring-white focus-visible:ring-offset-black/40"
  );

  return (
    <div
      className={cn(
        "group/carousel relative h-full w-full overflow-hidden touch-pan-y",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      data-listing-card-carousel=""
      data-photo-count={count}
      tabIndex={hasMultiple ? 0 : undefined}
      role={hasMultiple ? "group" : undefined}
      aria-roledescription={hasMultiple ? "carousel" : undefined}
      aria-label={
        hasMultiple
          ? t("photoAriaLabel", { index: safeIndex + 1, count })
          : undefined
      }
    >
      {showPlaceholder ? (
        <div
          className="h-full w-full bg-gradient-to-br from-sand/90 to-sand/60"
          data-listing-card-placeholder=""
        />
      ) : (
        <Image
          key={currentUrl}
          src={currentUrl}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-transform duration-500 group-hover/card:scale-[1.02]",
            imageClassName
          )}
          onError={() =>
            setFailed((prev) => {
              const next = new Set(prev);
              next.add(safeIndex);
              return next;
            })
          }
        />
      )}

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label={t("previousPhotoAria")}
            className={cn(arrowClass, "left-2.5 sm:left-3")}
            onClick={(e) => onControlClick(-1, e)}
            onPointerDown={(e) => isolateCarouselControlEvent(e)}
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5px] sm:h-[18px] sm:w-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t("nextPhotoAria")}
            className={cn(arrowClass, "right-2.5 sm:right-3")}
            onClick={(e) => onControlClick(1, e)}
            onPointerDown={(e) => isolateCarouselControlEvent(e)}
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5px] sm:h-[18px] sm:w-[18px]" aria-hidden />
          </button>

          {showDots ? (
            <div
              className="pointer-events-none absolute bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5"
              data-listing-card-dots=""
              aria-hidden
            >
              {Array.from({ length: dotCount }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === activeDot ? "bg-white" : "bg-white/45"
                  )}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
