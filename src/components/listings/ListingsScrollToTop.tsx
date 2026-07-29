"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Force the listings search page to open at the top.
 * Soft navigation + browser scroll restoration can leave you mid-page / at the bottom.
 */
export function ListingsScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    const t = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      try {
        window.history.scrollRestoration = previous;
      } catch {
        /* ignore */
      }
    };
  }, [key]);

  return null;
}
