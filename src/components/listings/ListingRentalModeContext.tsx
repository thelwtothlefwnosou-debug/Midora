"use client";

import { createContext, useContext, useMemo } from "react";
import type { ListingWithImages } from "@/lib/types";
import {
  fixedPublicRentalMode,
  type PublicRentalMode,
} from "@/lib/listing-rental-modes";
import { listingRentalType } from "@/lib/rental-types";

type Ctx = {
  mode: PublicRentalMode;
  showBoth: false;
  showShort: boolean;
  showMonthly: boolean;
};

const ListingRentalModeContext = createContext<Ctx | null>(null);

export function ListingRentalModeProvider({
  listing,
  children,
}: {
  listing: ListingWithImages;
  children: React.ReactNode;
}) {
  const mode = fixedPublicRentalMode(listing);
  const rt = listingRentalType(listing);

  const value = useMemo(
    () => ({
      mode,
      showBoth: false as const,
      showShort: rt === "short_term",
      showMonthly: rt === "monthly",
    }),
    [mode, rt]
  );

  return (
    <ListingRentalModeContext.Provider value={value}>
      {children}
    </ListingRentalModeContext.Provider>
  );
}

export function useListingRentalMode() {
  const ctx = useContext(ListingRentalModeContext);
  if (!ctx) {
    throw new Error("useListingRentalMode must be used within ListingRentalModeProvider");
  }
  return ctx;
}
