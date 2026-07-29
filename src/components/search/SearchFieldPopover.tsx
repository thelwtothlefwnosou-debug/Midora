"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type PopoverPlacement = "below-anchor" | "below-center";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Extra elements that should not close the popover on outside click (e.g. search submit). */
  ignoreRefs?: React.RefObject<HTMLElement | null>[];
  placement?: PopoverPlacement;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  preferredWidth?: number;
  /** Full-screen / bottom sheet on small screens */
  mobileSheet?: boolean;
  /** Very subtle page scrim behind popover (desktop). */
  scrim?: boolean;
  title?: string;
  labelledBy?: string;
};

const VIEWPORT_PAD = 24;
const ANCHOR_GAP = 8;

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

type PopoverRect = {
  top: number;
  left: number;
  width: number;
};

function clampLeft(left: number, width: number): number {
  const maxLeft = window.innerWidth - width - VIEWPORT_PAD;
  return Math.max(VIEWPORT_PAD, Math.min(left, maxLeft));
}

/** Narrow popover: center on anchor element. */
function computeBelowAnchor(rect: DOMRect, width: number): PopoverRect {
  const maxWidth = Math.min(width, window.innerWidth - VIEWPORT_PAD * 2);
  const left = clampLeft(rect.left + rect.width / 2 - maxWidth / 2, maxWidth);
  return {
    top: rect.bottom + ANCHOR_GAP,
    left,
    width: maxWidth,
  };
}

/** Wide popover: centered under the search shell (not viewport). */
function computeBelowShell(rect: DOMRect, width: number): PopoverRect {
  const maxWidth = Math.min(width, window.innerWidth - VIEWPORT_PAD * 2);
  const left = clampLeft(rect.left + rect.width / 2 - maxWidth / 2, maxWidth);
  return {
    top: rect.bottom + ANCHOR_GAP,
    left,
    width: maxWidth,
  };
}

function readPopoverPosition(
  anchorEl: HTMLElement | null | undefined,
  placement: PopoverPlacement,
  preferredWidth = 820
): PopoverRect | null {
  if (!anchorEl || typeof window === "undefined") return null;
  const rect = anchorEl.getBoundingClientRect();
  const width =
    placement === "below-center"
      ? preferredWidth
      : Math.min(preferredWidth, Math.max(rect.width, 320));
  return placement === "below-center"
    ? computeBelowShell(rect, width)
    : computeBelowAnchor(rect, width);
}

function fallbackPopoverPosition(width = 820): PopoverRect {
  const maxWidth =
    typeof window === "undefined"
      ? width
      : Math.min(width, window.innerWidth - VIEWPORT_PAD * 2);
  const left =
    typeof window === "undefined"
      ? VIEWPORT_PAD
      : clampLeft((window.innerWidth - maxWidth) / 2, maxWidth);
  return {
    top: 120,
    left,
    width: maxWidth,
  };
}

export function SearchFieldPopover({
  open,
  onOpenChange,
  anchorRef,
  ignoreRefs = [],
  placement = "below-anchor",
  children,
  className,
  panelClassName,
  preferredWidth = 820,
  mobileSheet = true,
  scrim = true,
  title,
  labelledBy,
}: Props) {
  const t = useTranslations("Search");
  const fallbackTitleId = useId();
  const titleId = labelledBy ?? fallbackTitleId;
  const isMobile = useIsMobile();
  const useSheet = mobileSheet && isMobile;
  const [position, setPosition] = useState<PopoverRect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);

  useLayoutEffect(() => {
    if (!open || useSheet) {
      setPosition(null);
      return;
    }

    function update() {
      setPosition(
        readPopoverPosition(anchorRef?.current, placement, preferredWidth) ??
          fallbackPopoverPosition(preferredWidth)
      );
    }

    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open, placement, preferredWidth, useSheet]);

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open || useSheet) return;

    // Ignore outside presses from the same gesture that opened the popover.
    // Without this, open → mount → outside-click can flash closed (esp. with lazy load).
    const OPEN_GRACE_MS = 700;

    function onPointerDown(e: MouseEvent) {
      if (Date.now() - openedAtRef.current < OPEN_GRACE_MS) return;
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      for (const ref of ignoreRefs) {
        if (ref.current?.contains(target)) return;
      }
      onOpenChange(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [anchorRef, ignoreRefs, onOpenChange, open, useSheet]);

  function requestClose() {
    if (Date.now() - openedAtRef.current < 700) return;
    onOpenChange(false);
  }

  if (!open || typeof document === "undefined") return null;

  if (useSheet) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[210] flex items-end justify-center">
            <motion.button
              type="button"
              aria-label={t("close")}
              className="absolute inset-0 bg-charcoal/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={requestClose}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              className={cn(
                "relative w-full max-h-[92dvh] overflow-y-auto rounded-t-[20px] border border-border bg-white shadow-float",
                panelClassName
              )}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              {title ? (
                <div className="border-b border-border px-5 py-4">
                  <h3 id={titleId} className="font-display text-lg font-semibold text-charcoal">
                    {title}
                  </h3>
                </div>
              ) : null}
              <div className={cn("p-5", className)}>{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  const resolvedPosition =
    position ??
    readPopoverPosition(anchorRef?.current, placement, preferredWidth) ??
    fallbackPopoverPosition(preferredWidth);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {scrim ? (
            <motion.div
              className="fixed inset-0 z-[175] bg-charcoal/[0.04]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              aria-hidden
              onClick={requestClose}
            />
          ) : null}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby={title ? titleId : undefined}
            className={cn(
              "search-field-popover fixed z-[180] overflow-hidden rounded-[24px] border border-charcoal/8 bg-white shadow-[0_16px_48px_-12px_rgba(26,26,26,0.18)]",
              panelClassName
            )}
            style={{
              top: resolvedPosition.top,
              left: resolvedPosition.left,
              width: resolvedPosition.width,
              transformOrigin: "top center",
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {title ? (
              <div className="border-b border-border/70 px-5 py-3">
                <h3 id={titleId} className="text-sm font-semibold text-charcoal">
                  {title}
                </h3>
              </div>
            ) : null}
            <div className={cn(className)}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
