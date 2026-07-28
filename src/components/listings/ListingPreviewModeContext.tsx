"use client";

import { createContext, useContext } from "react";
import { showToast } from "@/lib/toast-store";

const ListingPreviewModeContext = createContext(false);

export function ListingPreviewModeProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  return (
    <ListingPreviewModeContext.Provider value={enabled}>
      {children}
    </ListingPreviewModeContext.Provider>
  );
}

export function useListingPreviewMode(): boolean {
  return useContext(ListingPreviewModeContext);
}

export function guardPreviewAction(
  previewMode: boolean,
  blockedMessage: string,
  action: () => void
): void {
  if (previewMode) {
    showToast(blockedMessage);
    return;
  }
  action();
}
