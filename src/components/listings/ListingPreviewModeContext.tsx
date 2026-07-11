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

export function previewModeBlockedMessage(): string {
  return "Αυτό είναι δοκιμαστικό preview. Οι επισκέπτες θα μπορούν να στείλουν αίτημα από εδώ.";
}

export function guardPreviewAction(previewMode: boolean, action: () => void): void {
  if (previewMode) {
    showToast(previewModeBlockedMessage());
    return;
  }
  action();
}
