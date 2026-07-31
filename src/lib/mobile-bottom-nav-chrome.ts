/**
 * Phone bottom-nav chrome flags (body data attributes + CSS).
 * Scroll hide uses transform only — no layout shift / padding change.
 */

const SCROLL_ATTR = "data-midora-mnav-scroll-hidden";
const OVERLAY_ATTR = "data-midora-mnav-overlay";

export function setMobileBottomNavScrollHidden(hidden: boolean): void {
  if (typeof document === "undefined") return;
  if (hidden) document.body.setAttribute(SCROLL_ATTR, "1");
  else document.body.removeAttribute(SCROLL_ATTR);
}

/** Filter dialog, date picker, guest picker, dashboard drawer, etc. */
export function setMobileBottomNavOverlayHidden(hidden: boolean): void {
  if (typeof document === "undefined") return;
  if (hidden) document.body.setAttribute(OVERLAY_ATTR, "1");
  else document.body.removeAttribute(OVERLAY_ATTR);
}
