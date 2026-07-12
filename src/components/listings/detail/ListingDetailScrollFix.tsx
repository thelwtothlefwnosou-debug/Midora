"use client";

import { useEffect } from "react";

/** Prevent body overflow-x:hidden from breaking position:sticky on listing detail. */
export function ListingDetailScrollFix() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflowX;
    const prevBody = body.style.overflowX;
    html.style.overflowX = "clip";
    body.style.overflowX = "clip";
    return () => {
      html.style.overflowX = prevHtml;
      body.style.overflowX = prevBody;
    };
  }, []);

  return null;
}
