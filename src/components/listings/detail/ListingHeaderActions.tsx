"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Share } from "lucide-react";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { ListingReportButton } from "@/components/listings/ListingReportButton";
import { cn } from "@/lib/utils";

const textActionClass =
  "inline-flex items-center gap-2 text-sm font-semibold text-charcoal underline decoration-charcoal underline-offset-[3px] transition-colors hover:text-charcoal/80";

const iconCircleClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal transition-colors hover:border-charcoal/25 hover:bg-charcoal/[0.02]";

type Props = {
  listingId: string;
  listingTitle: string;
  isFavorited: boolean;
  onShare: () => void;
  className?: string;
};

export function ListingHeaderActions({
  listingId,
  listingTitle,
  isFavorited,
  onShare,
  className,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div className={cn("flex shrink-0 items-center gap-4 sm:gap-5", className)}>
      <button type="button" onClick={onShare} className={textActionClass}>
        <Share className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        Κοινοποίηση
      </button>

      <FavoriteButton
        listingId={listingId}
        initialFavorited={isFavorited}
        variant="underline"
      />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={iconCircleClass}
          aria-label="Περισσότερες επιλογές"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-charcoal/10 bg-white py-1 shadow-lg">
            <ListingReportButton
              listingTitle={listingTitle}
              listingId={listingId}
              className="w-full justify-start px-4 py-2.5 hover:bg-sand/50"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact circles for gallery overlay (mobile). */
export function ListingHeaderIconActions({
  listingId,
  listingTitle,
  isFavorited,
  onShare,
  className,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onShare}
        className={iconCircleClass}
        aria-label="Κοινοποίηση"
      >
        <Share className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
      <FavoriteButton
        listingId={listingId}
        initialFavorited={isFavorited}
        size="sm"
        variant="circle"
      />
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={iconCircleClass}
          aria-label="Περισσότερες επιλογές"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-charcoal/10 bg-white py-1 shadow-lg">
            <ListingReportButton
              listingTitle={listingTitle}
              listingId={listingId}
              className="w-full justify-start px-4 py-2.5 hover:bg-sand/50"
            />
          </div>
        )}
      </div>
    </div>
  );
}
