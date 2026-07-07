"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export function useFloatingDropdown(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  minWidth = 280
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle({ visibility: "hidden" });
      return;
    }

    function update() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, minWidth),
        maxWidth: "min(calc(100vw - 1rem), 420px)",
        zIndex: 9999,
        visibility: "visible",
      });
    }

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, minWidth]);

  return style;
}
