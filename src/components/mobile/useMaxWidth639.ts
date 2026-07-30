"use client";

import { useEffect, useState } from "react";

/**
 * Phone-only layout gate (max-width: 639px).
 * Independent from useIsMobile(767) and useIsLgUp(1024).
 * Returns null until mounted to avoid wrong layout flash.
 */
export function useMaxWidth639(): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return matches;
}
