"use client";

import { useEffect } from "react";

/**
 * Prevent body/html overflow-x:hidden from breaking position:sticky on listing detail.
 * Prefer overflow-x:clip (does not force overflow-y to auto the way hidden can).
 * Re-assert after date-picker modal close, which previously wiped inline overflow via the shorthand.
 */
export function ListingDetailScrollFix() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const apply = () => {
      html.style.overflowX = "clip";
      body.style.overflowX = "clip";
    };

    const prevHtml = html.style.overflowX;
    const prevBody = body.style.overflowX;
    apply();

    // If a modal sets/clears overflow shorthand, restore clip without fighting overflowY locks.
    const observer = new MutationObserver(() => {
      if (html.style.overflowX !== "clip" || body.style.overflowX !== "clip") {
        apply();
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ["style"] });
    observer.observe(body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      observer.disconnect();
      html.style.overflowX = prevHtml;
      body.style.overflowX = prevBody;
    };
  }, []);

  return null;
}
