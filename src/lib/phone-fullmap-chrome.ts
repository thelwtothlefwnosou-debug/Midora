/**
 * Body flag so MobileBottomNav / Help FAB can hide during phone full-map mode.
 * CSS: body[data-midora-phone-fullmap="1"] …
 */
export const PHONE_FULLMAP_BODY_ATTR = "data-midora-phone-fullmap";

export function setPhoneFullMapBodyFlag(active: boolean): void {
  if (typeof document === "undefined") return;
  if (active) document.body.setAttribute(PHONE_FULLMAP_BODY_ATTR, "1");
  else document.body.removeAttribute(PHONE_FULLMAP_BODY_ATTR);
}
