import type { ListingSleepingArrangement } from "@/lib/types";
import type { PhotoRoomDef } from "@/lib/photo-rooms-catalog";
import { pickLocale } from "@/lib/locale-fallbacks";

export function roomBedSummary(
  room: PhotoRoomDef,
  arrangements: ListingSleepingArrangement[]
): string | null {
  const match = room.key.match(/^bedroom_(\d+)$/);
  if (!match) return null;

  const index = parseInt(match[1], 10) - 1;
  const sorted = [...arrangements].sort((a, b) => a.sort_order - b.sort_order);
  const row = sorted[index];
  if (!row) return null;

  return [
    row.quantity > 1 ? `${row.quantity}×` : null,
    row.bed_type,
    row.bed_size_note?.trim() || null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function roomPublicDetail(
  room: PhotoRoomDef,
  arrangements: ListingSleepingArrangement[],
  locale?: string
): string {
  const bed = roomBedSummary(room, arrangements);
  if (bed) return bed;

  switch (room.key) {
    case "kitchen":
      return pickLocale(locale, "Πλήρως εξοπλισμένη", "Fully equipped");
    case "living_room":
      return pickLocale(locale, "Καθιστικό", "Living area");
    case "bathroom_1":
    case "bathroom_2":
    case "bathroom_3":
      return pickLocale(locale, "Μπάνιο", "Bathroom");
    case "balcony":
    case "garden":
    case "outdoor":
      return pickLocale(locale, "Εξωτερικός χώρος", "Outdoor area");
    default:
      return "";
  }
}
