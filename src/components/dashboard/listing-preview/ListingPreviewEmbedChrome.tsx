"use client";

import { useEffect } from "react";

/** Minimal chrome for mobile preview iframe — scrollable body, no global widgets. */
export function ListingPreviewEmbedChrome() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.add("listing-preview-embed");
    body.classList.add("listing-preview-embed");

    return () => {
      html.classList.remove("listing-preview-embed");
      body.classList.remove("listing-preview-embed");
    };
  }, []);

  return null;
}
