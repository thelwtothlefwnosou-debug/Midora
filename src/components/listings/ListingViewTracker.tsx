"use client";

import { useEffect } from "react";

/** Records one view per browser session for a listing detail page. */
export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    if (!listingId) return;

    const key = `midora-view:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* private mode */
    }

    fetch(`/api/listings/${listingId}/view`, { method: "POST", keepalive: true })
      .then(() => {
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* non-blocking */
      });
  }, [listingId]);

  return null;
}
