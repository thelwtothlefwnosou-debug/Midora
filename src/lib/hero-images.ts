/**
 * Homepage hero background options.
 * Swap ACTIVE_HERO_IMAGE_ID to try another approved asset without layout changes.
 */

export type HeroImageOption = {
  id: string;
  label: string;
  desktop: string;
  mobile: string;
  /** CSS object-position for desktop / tablet */
  objectPositionDesktop: string;
  /** CSS object-position for mobile art-directed crop */
  objectPositionMobile: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

/** Licensed / approved hero backgrounds only. */
export const HERO_IMAGES: readonly HeroImageOption[] = [
  {
    id: "warm-interior",
    label: "Warm soft living room",
    desktop: "/images/home/hero/hero-warm-interior-desktop.webp",
    mobile: "/images/home/hero/hero-warm-interior-mobile.webp",
    objectPositionDesktop: "50% 36%",
    objectPositionMobile: "52% 34%",
    credit: "Spacejoy",
    license: "Unsplash License",
    sourceUrl: "https://unsplash.com/photos/c0JoR_-2x3E",
  },
] as const;

export const ACTIVE_HERO_IMAGE_ID: (typeof HERO_IMAGES)[number]["id"] =
  "warm-interior";

export function getActiveHeroImage(): HeroImageOption {
  return (
    HERO_IMAGES.find((image) => image.id === ACTIVE_HERO_IMAGE_ID) ??
    HERO_IMAGES[0]
  );
}
