import { pickLocale } from "@/lib/locale-fallbacks";

export type PhotoRoomKey =
  | "living_room"
  | "dining_room"
  | "kitchen"
  | "bedroom_1"
  | "bedroom_2"
  | "bedroom_3"
  | "bedroom_4"
  | "bathroom_1"
  | "bathroom_2"
  | "bathroom_3"
  | "balcony"
  | "outdoor"
  | "garden"
  | "workspace"
  | "parking"
  | "other";

export type PhotoRoomDef = {
  key: PhotoRoomKey;
  label: string;
};

const BEDROOM_KEYS: PhotoRoomKey[] = [
  "bedroom_1",
  "bedroom_2",
  "bedroom_3",
  "bedroom_4",
];

const BATHROOM_KEYS: PhotoRoomKey[] = ["bathroom_1", "bathroom_2", "bathroom_3"];

const PHOTO_ROOM_LABELS: Record<PhotoRoomKey, string> = {
  living_room: "Σαλόνι",
  dining_room: "Τραπεζαρία",
  kitchen: "Κουζίνα",
  bedroom_1: "Υπνοδωμάτιο 1",
  bedroom_2: "Υπνοδωμάτιο 2",
  bedroom_3: "Υπνοδωμάτιο 3",
  bedroom_4: "Υπνοδωμάτιο 4",
  bathroom_1: "Μπάνιο",
  bathroom_2: "Μπάνιο 2",
  bathroom_3: "Μπάνιο 3",
  balcony: "Μπαλκόνι / εξωτερικός χώρος",
  outdoor: "Εξωτερικός χώρος",
  garden: "Κήπος",
  workspace: "Γραφείο",
  parking: "Parking",
  other: "Άλλος χώρος",
};

const PHOTO_ROOM_LABELS_EN: Record<PhotoRoomKey, string> = {
  living_room: "Living room",
  dining_room: "Dining room",
  kitchen: "Kitchen",
  bedroom_1: "Bedroom 1",
  bedroom_2: "Bedroom 2",
  bedroom_3: "Bedroom 3",
  bedroom_4: "Bedroom 4",
  bathroom_1: "Bathroom",
  bathroom_2: "Bathroom 2",
  bathroom_3: "Bathroom 3",
  balcony: "Balcony / outdoor area",
  outdoor: "Outdoor area",
  garden: "Garden",
  workspace: "Office",
  parking: "Parking",
  other: "Other room",
};

export function photoRoomLabel(key: string, locale?: string): string {
  if (key in PHOTO_ROOM_LABELS_EN) {
    return pickLocale(
      locale,
      PHOTO_ROOM_LABELS[key as PhotoRoomKey] ?? key,
      PHOTO_ROOM_LABELS_EN[key as PhotoRoomKey]
    );
  }
  return key;
}

type PhotoRoomT = (key: string) => string;

export function getPhotoRoomLabel(key: string, t?: PhotoRoomT, locale?: string): string {
  if (t && isPhotoRoomKey(key)) {
    try {
      const label = t(key === "bedroom_1" ? "bedroom" : key);
      if (label && !label.endsWith(`.${key}`)) return label;
    } catch {
      /* fall through */
    }
  }
  return photoRoomLabel(key, locale);
}

/** i18n-aware variant of `suggestPhotoRooms` via `Listing.photoRooms` messages. */
export function getSuggestPhotoRooms(
  listing: { bedrooms: number; bathrooms: number | null },
  t?: PhotoRoomT,
  locale?: string
): PhotoRoomDef[] {
  const label = (key: PhotoRoomKey, single?: boolean) => {
    if (t) {
      if (single && key.startsWith("bedroom")) return t("bedroom");
      if (single && key.startsWith("bathroom")) return t("bathroom");
      return getPhotoRoomLabel(key, t, locale);
    }
    if (single && key.startsWith("bedroom")) {
      return pickLocale(locale, "Υπνοδωμάτιο", "Bedroom");
    }
    if (single && key.startsWith("bathroom")) {
      return pickLocale(locale, "Μπάνιο", "Bathroom");
    }
    return photoRoomLabel(key, locale);
  };

  const rooms: PhotoRoomDef[] = [
    { key: "living_room", label: label("living_room") },
    { key: "dining_room", label: label("dining_room") },
    { key: "kitchen", label: label("kitchen") },
  ];

  const bedroomCount = Math.max(0, Math.min(4, listing.bedrooms));
  for (let i = 0; i < bedroomCount; i++) {
    const key = BEDROOM_KEYS[i];
    rooms.push({
      key,
      label: bedroomCount === 1 ? label(key, true) : label(key),
    });
  }

  const bathroomCount = Math.max(1, Math.min(3, listing.bathrooms ?? 1));
  for (let i = 0; i < bathroomCount; i++) {
    const key = BATHROOM_KEYS[i];
    rooms.push({
      key,
      label: bathroomCount === 1 ? label(key, true) : label(key),
    });
  }

  rooms.push({ key: "balcony", label: label("balcony") });
  return rooms;
}

export function isPhotoRoomKey(key: string): key is PhotoRoomKey {
  return key in PHOTO_ROOM_LABELS;
}

/** Suggested rooms based on listing layout (bedrooms / bathrooms). */
export function suggestPhotoRooms(
  listing: {
    bedrooms: number;
    bathrooms: number | null;
  },
  locale?: string
): PhotoRoomDef[] {
  const rooms: PhotoRoomDef[] = [
    { key: "living_room", label: photoRoomLabel("living_room", locale) },
    { key: "dining_room", label: photoRoomLabel("dining_room", locale) },
    { key: "kitchen", label: photoRoomLabel("kitchen", locale) },
  ];

  const bedroomCount = Math.max(0, Math.min(4, listing.bedrooms));
  for (let i = 0; i < bedroomCount; i++) {
    const key = BEDROOM_KEYS[i];
    rooms.push({
      key,
      label:
        bedroomCount === 1
          ? pickLocale(locale, "Υπνοδωμάτιο", "Bedroom")
          : photoRoomLabel(key, locale),
    });
  }

  const bathroomCount = Math.max(1, Math.min(3, listing.bathrooms ?? 1));
  for (let i = 0; i < bathroomCount; i++) {
    const key = BATHROOM_KEYS[i];
    rooms.push({
      key,
      label:
        bathroomCount === 1
          ? pickLocale(locale, "Μπάνιο", "Bathroom")
          : photoRoomLabel(key, locale),
    });
  }

  rooms.push({ key: "balcony", label: photoRoomLabel("balcony", locale) });
  return rooms;
}

export function generalPhotosGroupLabel(locale?: string): string {
  return pickLocale(locale, "Γενικές φωτογραφίες", "General photos");
}

export function groupImagesByRoom<T extends { room_key?: string | null; media_type?: string }>(
  images: T[],
  rooms: PhotoRoomDef[],
  generalLabel?: string,
  locale?: string
): { room: PhotoRoomDef; images: T[] }[] {
  const label = generalLabel ?? generalPhotosGroupLabel(locale);
  const photos = images.filter((img) => img.media_type !== "video");
  const byKey = new Map<string, T[]>();

  for (const photo of photos) {
    const key = photo.room_key && isPhotoRoomKey(photo.room_key) ? photo.room_key : "unassigned";
    const list = byKey.get(key) ?? [];
    list.push(photo);
    byKey.set(key, list);
  }

  const grouped = rooms
    .map((room) => ({ room, images: byKey.get(room.key) ?? [] }))
    .filter((g) => g.images.length > 0);

  const unassigned = byKey.get("unassigned") ?? [];
  if (unassigned.length > 0) {
    grouped.push({
      room: { key: "other", label },
      images: unassigned,
    });
  }

  return grouped;
}
