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

export function photoRoomLabel(key: string): string {
  return PHOTO_ROOM_LABELS[key as PhotoRoomKey] ?? key;
}

export function isPhotoRoomKey(key: string): key is PhotoRoomKey {
  return key in PHOTO_ROOM_LABELS;
}

/** Suggested rooms based on listing layout (bedrooms / bathrooms). */
export function suggestPhotoRooms(listing: {
  bedrooms: number;
  bathrooms: number | null;
}): PhotoRoomDef[] {
  const rooms: PhotoRoomDef[] = [
    { key: "living_room", label: PHOTO_ROOM_LABELS.living_room },
    { key: "dining_room", label: PHOTO_ROOM_LABELS.dining_room },
    { key: "kitchen", label: PHOTO_ROOM_LABELS.kitchen },
  ];

  const bedroomCount = Math.max(0, Math.min(4, listing.bedrooms));
  for (let i = 0; i < bedroomCount; i++) {
    const key = BEDROOM_KEYS[i];
    rooms.push({
      key,
      label: bedroomCount === 1 ? "Υπνοδωμάτιο" : PHOTO_ROOM_LABELS[key],
    });
  }

  const bathroomCount = Math.max(1, Math.min(3, listing.bathrooms ?? 1));
  for (let i = 0; i < bathroomCount; i++) {
    const key = BATHROOM_KEYS[i];
    rooms.push({
      key,
      label: bathroomCount === 1 ? "Μπάνιο" : PHOTO_ROOM_LABELS[key],
    });
  }

  rooms.push({ key: "balcony", label: PHOTO_ROOM_LABELS.balcony });
  return rooms;
}

export function groupImagesByRoom<T extends { room_key?: string | null; media_type?: string }>(
  images: T[],
  rooms: PhotoRoomDef[]
): { room: PhotoRoomDef; images: T[] }[] {
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
      room: { key: "other", label: "Γενικές φωτογραφίες" },
      images: unassigned,
    });
  }

  return grouped;
}
