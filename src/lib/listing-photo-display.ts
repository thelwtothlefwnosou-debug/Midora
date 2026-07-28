import type { ListingImage } from "@/lib/types";
import { pickLocale } from "@/lib/locale-fallbacks";
import { isPhotoRoomKey, photoRoomLabel, getPhotoRoomLabel, type PhotoRoomDef } from "@/lib/photo-rooms-catalog";

/** Public display order: cover first, then sort_order. */
export function sortListingPhotosForDisplay(images: ListingImage[]): ListingImage[] {
  return [...images]
    .filter((img) => img.media_type !== "video")
    .sort((a, b) => {
      const aCover = a.is_cover ? 1 : 0;
      const bCover = b.is_cover ? 1 : 0;
      if (aCover !== bCover) return bCover - aCover;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
}

export function isCoverPhoto(img: ListingImage, sortedIndex: number): boolean {
  if (typeof img.is_cover === "boolean") return img.is_cover;
  return sortedIndex === 0;
}

export type PhotoGalleryFilterId =
  | "all"
  | "living"
  | "bedrooms"
  | "kitchen"
  | "bathrooms"
  | "outdoor";

const PHOTO_GALLERY_FILTER_LABELS_EN: Record<PhotoGalleryFilterId, string> = {
  all: "All",
  living: "Living room",
  bedrooms: "Bedrooms",
  kitchen: "Kitchen",
  bathrooms: "Bathrooms",
  outdoor: "Outdoor areas",
};

export const PHOTO_GALLERY_FILTERS: {
  id: PhotoGalleryFilterId;
  label: string;
  labelKey: PhotoGalleryFilterId;
  keys: string[];
}[] = [
  { id: "all", label: "Όλες", labelKey: "all", keys: [] },
  {
    id: "living",
    label: "Σαλόνι",
    labelKey: "living",
    keys: ["living_room", "dining_room", "workspace"],
  },
  {
    id: "bedrooms",
    label: "Υπνοδωμάτια",
    labelKey: "bedrooms",
    keys: ["bedroom_1", "bedroom_2", "bedroom_3", "bedroom_4"],
  },
  { id: "kitchen", label: "Κουζίνα", labelKey: "kitchen", keys: ["kitchen"] },
  {
    id: "bathrooms",
    label: "Μπάνια",
    labelKey: "bathrooms",
    keys: ["bathroom_1", "bathroom_2", "bathroom_3"],
  },
  {
    id: "outdoor",
    label: "Εξωτερικοί χώροι",
    labelKey: "outdoor",
    keys: ["balcony", "outdoor", "garden", "parking"],
  },
];

export function photoGalleryFilterLabel(id: PhotoGalleryFilterId, locale?: string): string {
  const tab = PHOTO_GALLERY_FILTERS.find((t) => t.id === id);
  if (!tab) return id;
  return pickLocale(locale, tab.label, PHOTO_GALLERY_FILTER_LABELS_EN[id]);
}

export function filterPhotosByGalleryTab(
  photos: ListingImage[],
  tabId: PhotoGalleryFilterId
): ListingImage[] {
  if (tabId === "all") return photos;
  const tab = PHOTO_GALLERY_FILTERS.find((t) => t.id === tabId);
  if (!tab) return photos;
  return photos.filter((p) => p.room_key && tab.keys.includes(p.room_key));
}

export function filterPhotosByRoomKey(photos: ListingImage[], roomKey: string): ListingImage[] {
  return photos.filter((p) => p.room_key === roomKey);
}

export function roomKeyToGalleryFilter(roomKey: string): PhotoGalleryFilterId {
  if (roomKey.startsWith("bedroom_")) return "bedrooms";
  if (roomKey.startsWith("bathroom_")) return "bathrooms";
  if (roomKey === "kitchen") return "kitchen";
  if (["balcony", "outdoor", "garden", "parking"].includes(roomKey)) return "outdoor";
  if (["living_room", "dining_room", "workspace"].includes(roomKey)) return "living";
  return "all";
}
export function availableGalleryFilters(photos: ListingImage[]): PhotoGalleryFilterId[] {
  const ids: PhotoGalleryFilterId[] = ["all"];
  for (const tab of PHOTO_GALLERY_FILTERS) {
    if (tab.id === "all") continue;
    if (photos.some((p) => p.room_key && tab.keys.includes(p.room_key))) {
      ids.push(tab.id);
    }
  }
  return ids;
}

export function roomBadgeLabel(
  roomKey: string | null | undefined,
  locale?: string,
  t?: (key: string) => string
): string | null {
  if (!roomKey || !isPhotoRoomKey(roomKey)) return null;
  return getPhotoRoomLabel(roomKey, t, locale);
}

export function photoManagerSummary(
  images: ListingImage[],
  rooms: PhotoRoomDef[]
): {
  total: number;
  coverCount: number;
  roomsWithPhotos: number;
  unassigned: number;
} {
  const photos = images.filter((i) => i.media_type !== "video");
  const sorted = sortListingPhotosForDisplay(photos);
  const coverCount = sorted.some((p, i) => isCoverPhoto(p, i)) ? 1 : 0;
  const assignedKeys = new Set(
    photos.map((p) => p.room_key).filter((k): k is string => Boolean(k && isPhotoRoomKey(k)))
  );
  const roomsWithPhotos = rooms.filter((r) => assignedKeys.has(r.key)).length;
  const unassigned = photos.filter((p) => !p.room_key || !isPhotoRoomKey(p.room_key)).length;
  return {
    total: photos.length,
    coverCount,
    roomsWithPhotos,
    unassigned,
  };
}

/** Soft recommendation: key rooms in first 5 photos. */
export function firstFiveRoomWarning(photos: ListingImage[], locale?: string): string | null {
  const sorted = sortListingPhotosForDisplay(photos).slice(0, 5);
  const keys = new Set(sorted.map((p) => p.room_key).filter(Boolean));
  const hasLiving = keys.has("living_room") || keys.has("dining_room");
  const hasBed = ["bedroom_1", "bedroom_2", "bedroom_3", "bedroom_4"].some((k) => keys.has(k));
  const hasKitchen = keys.has("kitchen");
  const hasBath = ["bathroom_1", "bathroom_2", "bathroom_3"].some((k) => keys.has(k));
  if (hasLiving && hasBed && hasKitchen && hasBath) return null;
  return pickLocale(
    locale,
    "Πρόσθεσε στις πρώτες φωτογραφίες σαλόνι, υπνοδωμάτιο, κουζίνα ή μπάνιο για καλύτερη παρουσίαση.",
    "Add living room, bedroom, kitchen, or bathroom photos early for a stronger first impression."
  );
}
