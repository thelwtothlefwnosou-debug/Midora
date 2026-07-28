"use client";

import {
  Bed,
  Bath,
  Maximize,
  Building2,
  Calendar,
  Sofa,
  DoorOpen,
  ArrowUpDown,
  Car,
  Flame,
  Zap,
  PawPrint,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListingWithImages } from "@/lib/types";
import {
  formatFloorLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import {
  formatPublicBedroomsLabel,
  formatPublicBathroomsLabel,
  formatPublicSqmLabel,
  type PublicLabelsT,
} from "@/lib/listing-public-labels";
import { getHeatingTypeLabel, getEnergyClassLabel } from "@/lib/listing-labels";

type DetailItem = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

/** next-intl translator for `Listing` (or compatible) messages. */
type ListingT = (key: string, values?: Record<string, string | number>) => string;

function floorLabel(floor: number | null, total: number | null, t: ListingT): string | null {
  if (floor == null && total == null) return null;
  const floorPart = floor != null ? formatFloorLabel(floor) : null;
  if (floorPart && total != null) {
    return t("propertyDetails.floorOfTotal", { floor: floorPart, total });
  }
  if (floorPart) return floorPart;
  if (total != null) return t("propertyDetails.totalFloors", { total });
  return null;
}

export function getListingPropertyDetails(
  listing: ListingWithImages,
  tLabels: PublicLabelsT,
  t: ListingT,
  tCommon: ListingT
): DetailItem[] {
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const items: DetailItem[] = [];
  const yes = tCommon("yes");
  const no = tCommon("no");

  if (listing.sqm) {
    items.push({
      label: t("propertyDetails.sqm"),
      value: formatPublicSqmLabel(listing.sqm, tLabels),
      icon: Maximize,
    });
  }
  const floor = floorLabel(listing.floor, listing.total_floors, t);
  if (floor) items.push({ label: t("propertyDetails.floor"), value: floor, icon: Building2 });
  if (listing.year_built) {
    items.push({
      label: t("propertyDetails.yearBuilt"),
      value: String(listing.year_built),
      icon: Calendar,
    });
  }
  if (listing.year_renovated) {
    items.push({
      label: t("propertyDetails.yearRenovated"),
      value: String(listing.year_renovated),
      icon: Calendar,
    });
  }
  items.push({
    label: t("propertyDetails.bedrooms"),
    value: formatPublicBedroomsLabel(listing.bedrooms, tLabels),
    icon: Bed,
  });
  items.push({
    label: t("propertyDetails.bathrooms"),
    value: formatPublicBathroomsLabel(bathrooms, tLabels),
    icon: Bath,
  });
  items.push({
    label: t("propertyDetails.furnished"),
    value: listing.furnished ? yes : no,
    icon: Sofa,
  });
  items.push({
    label: t("propertyDetails.balcony"),
    value: listing.has_balcony ? yes : no,
    icon: DoorOpen,
  });
  items.push({
    label: t("propertyDetails.elevator"),
    value: listing.has_elevator ? yes : no,
    icon: ArrowUpDown,
  });
  items.push({
    label: t("propertyDetails.parking"),
    value: listing.has_parking ? yes : no,
    icon: Car,
  });
  if (listing.heating_type) {
    items.push({
      label: t("propertyDetails.heating"),
      value: getHeatingTypeLabel(listing.heating_type, tLabels),
      icon: Flame,
    });
  }
  if (listing.energy_class) {
    items.push({
      label: t("propertyDetails.energyClass"),
      value: getEnergyClassLabel(listing.energy_class, tLabels),
      icon: Zap,
    });
  }
  items.push({
    label: t("propertyDetails.pets"),
    value: listing.pets_allowed
      ? t("propertyDetails.petsAllowedValue")
      : t("propertyDetails.petsNotAllowedValue"),
    icon: PawPrint,
  });

  return items;
}

export function ListingPropertyDetails({ listing }: { listing: ListingWithImages }) {
  const t = useTranslations("Listing");
  const tLabels = useTranslations("Listing.labels");
  const tCommon = useTranslations("Common");
  const items = getListingPropertyDetails(listing, tLabels, t, tCommon);

  return (
    <div className="listing-section">
      <h2 className="listing-section-title">{t("propertyDetails.title")}</h2>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="listing-card flex items-center gap-3 px-4 py-3"
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0 text-gold/70" />}
            <div>
              <dt className="text-[10px] font-medium tracking-wider text-muted/80 uppercase">
                {item.label}
              </dt>
              <dd className="text-sm text-charcoal/80">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
