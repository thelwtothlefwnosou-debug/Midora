"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListingWithImages } from "@/lib/types";
import { NearbyListingCard } from "@/components/listings/detail/NearbyListingCard";
import { resolveListingSearchPrice } from "@/lib/listing-search-links";
import { isNearbyListingCandidate } from "@/lib/nearby-listing-candidates";
import { cn } from "@/lib/utils";

type Props = {
  currentListingId: string;
  listings: ListingWithImages[];
  rentalMode: "short_term" | "monthly";
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
};

function isRenderableNearbyCard(
  listing: ListingWithImages,
  rentalMode: "short_term" | "monthly",
  interestFrom?: string,
  interestTo?: string,
  durationMonths?: number
): boolean {
  if (!isNearbyListingCandidate(listing, rentalMode)) return false;
  const resolved = resolveListingSearchPrice(listing, {
    interestFrom,
    interestTo,
    durationMonths,
    rentalTypeFilter: rentalMode,
  });
  return Boolean(resolved.display && resolved.sortAmount > 0 && !resolved.isUnavailable);
}

export function NearbyListingsCarousel({
  currentListingId,
  listings,
  rentalMode,
  interestFrom,
  interestTo,
  durationMonths,
}: Props) {
  const searchParams = useSearchParams();
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const hrefParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("rentalType", rentalMode);
    return params;
  }, [rentalMode, searchParams]);

  const visibleListings = useMemo(
    () =>
      listings
        .filter((l) => l.id !== currentListingId)
        .filter((l) =>
          isRenderableNearbyCard(l, rentalMode, interestFrom, interestTo, durationMonths)
        ),
    [currentListingId, durationMonths, interestFrom, interestTo, listings, rentalMode]
  );

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || visibleListings.length === 0) return;

    const firstCard = track.querySelector<HTMLElement>("[data-nearby-card]");
    if (!firstCard) return;

    const gap = 16;
    const cardWidth = firstCard.offsetWidth;
    const visible = Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)));
    const pages = Math.max(1, Math.ceil(visibleListings.length / visible));

    setPageSize(visible);
    setPageCount(pages);

    const scrollPage = Math.round(track.scrollLeft / Math.max(cardWidth + gap, 1) / visible);
    setPage(Math.min(Math.max(0, scrollPage), pages - 1));
  }, [visibleListings.length]);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(track);

    const onScroll = () => {
      const firstCard = track.querySelector<HTMLElement>("[data-nearby-card]");
      if (!firstCard) return;
      const gap = 16;
      const cardWidth = firstCard.offsetWidth;
      const visible = Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)));
      const pages = Math.max(1, Math.ceil(visibleListings.length / visible));
      const scrollPage = Math.round(track.scrollLeft / Math.max(cardWidth + gap, 1) / visible);
      setPage(Math.min(Math.max(0, scrollPage), pages - 1));
      setPageSize(visible);
      setPageCount(pages);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      track.removeEventListener("scroll", onScroll);
    };
  }, [measure, visibleListings.length]);

  const scrollToPage = useCallback(
    (targetPage: number) => {
      const track = trackRef.current;
      const firstCard = track?.querySelector<HTMLElement>("[data-nearby-card]");
      if (!track || !firstCard) return;

      const gap = 16;
      const cardWidth = firstCard.offsetWidth;
      const clamped = Math.max(0, Math.min(targetPage, pageCount - 1));
      const offset = clamped * pageSize * (cardWidth + gap);

      track.scrollTo({ left: offset, behavior: "smooth" });
      setPage(clamped);
    },
    [pageCount, pageSize]
  );

  if (visibleListings.length < 1) return null;

  const title =
    rentalMode === "short_term"
      ? "Περισσότερα καταλύματα σε κοντινή απόσταση"
      : "Περισσότερα ακίνητα σε κοντινή απόσταση";

  const atStart = page <= 0;
  const atEnd = page >= pageCount - 1;

  return (
    <section
      className="nearby-listings-section scroll-mt-28 border-t-0 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-14"
      aria-label={title}
    >
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <h2 className="listing-section-title max-w-[min(100%,42rem)] text-[1.2rem] sm:text-[1.35rem]">
          {title}
        </h2>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <span className="min-w-[3rem] text-right text-sm tabular-nums text-muted">
            {page + 1} / {pageCount}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollToPage(page - 1)}
              disabled={atStart}
              aria-label="Προηγούμενη σελίδα"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal transition",
                atStart
                  ? "cursor-default opacity-35"
                  : "hover:border-charcoal/30 hover:bg-sand/40"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollToPage(page + 1)}
              disabled={atEnd}
              aria-label="Επόμενη σελίδα"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal transition",
                atEnd
                  ? "cursor-default opacity-35"
                  : "hover:border-charcoal/30 hover:bg-sand/40"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="nearby-listings-track -mx-1 flex gap-4 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] md:overflow-hidden [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {visibleListings.map((listing) => (
          <NearbyListingCard
            key={listing.id}
            listing={listing}
            rentalMode={rentalMode}
            interestFrom={interestFrom}
            interestTo={interestTo}
            durationMonths={durationMonths}
            searchParams={hrefParams}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs tabular-nums text-muted md:hidden">
        {page + 1} / {pageCount}
      </p>
    </section>
  );
}
