import type { ListingSleepingArrangement } from "@/lib/types";
import type { PhotoRoomDef } from "@/lib/photo-rooms-catalog";

const BEDROOM_KEY_PATTERN = /^bedroom_(\d+)$/;

export function roomBedSummary(
  room: PhotoRoomDef,
  arrangements: ListingSleepingArrangement[]
): string | null {
  const match = room.key.match(BEDROOM_KEY_PATTERN);
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
  arrangements: ListingSleepingArrangement[]
): string {
  const bed = roomBedSummary(room, arrangements);
  if (bed) return bed;

  switch (room.key) {
    case "kitchen":
      return "Πλήρως εξοπλισμένη";
    case "living_room":
      return "Καθιστικό";
    case "bathroom_1":
    case "bathroom_2":
    case "bathroom_3":
      return "Μπάνιο";
    case "balcony":
    case "garden":
    case "outdoor":
      return "Εξωτερικός χώρος";
    default:
      return "";
  }
}
