"use client";

import { ListingHeaderActions } from "@/components/listings/detail/ListingHeaderActions";
import type { ListingPublicDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  isFavorited: boolean;
  onShare: () => void;
  className?: string;
};

/** Owner-provided accommodation name + share/save — sits directly above the gallery. */
export function PublicListingTitleRow({
  listing,
  isFavorited,
  onShare,
  className,
}: Props) {
  return (
    <header className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <h1 className="listing-page-title min-w-0 flex-1">{listing.title}</h1>
      <ListingHeaderActions
        listingId={listing.id}
        listingTitle={listing.title}
        isFavorited={isFavorited}
        onShare={onShare}
        className="hidden shrink-0 sm:flex sm:pt-0.5"
      />
    </header>
  );
}
