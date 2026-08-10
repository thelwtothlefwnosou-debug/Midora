"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  guardPreviewAction,
  useListingPreviewMode,
} from "@/components/listings/ListingPreviewModeContext";

export type InterestPrefill = {
  message?: string;
  timingNote?: string;
  duration?: string;
  guests?: number;
  interestStartDate?: string;
  interestEndDate?: string;
  interestStartMonth?: string;
  interestDurationMonths?: number;
  intent?: "message" | "interest" | "rental_request";
  rentalMode?: "short_term" | "monthly";
  leadKind?: "availability" | "rental" | "message" | "free_hosting";
};

type Ctx = {
  openInterest: (prefill?: InterestPrefill) => void;
  registerOpener: (fn: ((prefill?: InterestPrefill) => void) | null) => void;
};

const ListingInterestContext = createContext<Ctx | null>(null);

export function ListingInterestProvider({ children }: { children: React.ReactNode }) {
  const openerRef = useRef<((prefill?: InterestPrefill) => void) | null>(null);
  const previewMode = useListingPreviewMode();
  const t = useTranslations("Listing");

  const registerOpener = useCallback(
    (fn: ((prefill?: InterestPrefill) => void) | null) => {
      openerRef.current = fn;
    },
    []
  );

  const openInterest = useCallback(
    (prefill?: InterestPrefill) => {
      guardPreviewAction(previewMode, t("previewModeBlocked"), () =>
        openerRef.current?.(prefill)
      );
    },
    [previewMode, t]
  );

  return (
    <ListingInterestContext.Provider value={{ openInterest, registerOpener }}>
      {children}
    </ListingInterestContext.Provider>
  );
}

export function useListingInterest() {
  const ctx = useContext(ListingInterestContext);
  if (!ctx) {
    return {
      openInterest: (_prefill?: InterestPrefill) => {},
      registerOpener: (_fn: ((prefill?: InterestPrefill) => void) | null) => {},
    };
  }
  return ctx;
}
