import type { LucideIcon } from "lucide-react";
import {
  ArrowUpDown,
  Bath,
  Car,
  Flame,
  KeyRound,
  Laptop,
  Leaf,
  Shield,
  Shirt,
  Snowflake,
  Sun,
  Tv,
  Umbrella,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  ac: Snowflake,
  heating: Flame,
  washer: Shirt,
  kitchen: UtensilsCrossed,
  tv: Tv,
  workspace: Laptop,
  iron: Shirt,
  hair_dryer: Wind,
  linens: Shirt,
  balcony: Sun,
  view: Waves,
  garden: Leaf,
  pool: Waves,
  yard: Leaf,
  terrace: Sun,
  bbq: Flame,
  elevator: ArrowUpDown,
  free_parking: Car,
  street_parking: Car,
  ground_floor: KeyRound,
  self_checkin: KeyRound,
  smoke_detector: Shield,
  fire_extinguisher: Shield,
  first_aid: Shield,
  outdoor_lighting: Sun,
  step_free: Bath,
  accessible_elevator: ArrowUpDown,
  accessible_bathroom: Bath,
  accessible_entrance: KeyRound,
};

const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  key: KeyRound,
  waves: Waves,
  car: Car,
  train: ArrowUpDown,
  users: Sun,
  laptop: Laptop,
  umbrella: Umbrella,
  paw: Leaf,
  pool: Waves,
  elevator: ArrowUpDown,
};

export function amenityIconForKey(key: string): LucideIcon {
  return AMENITY_ICONS[key] ?? Wifi;
}

export function highlightIconForKey(iconKey: string | null | undefined): LucideIcon {
  if (!iconKey) return Sun;
  return HIGHLIGHT_ICONS[iconKey] ?? Sun;
}
