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
import type { ListingWithImages } from "@/lib/types";
import {
  formatFloorLabel,
  resolveListingBathrooms,
} from "@/lib/listing-filter-helpers";
import {
  formatPublicBedroomsLabel,
  formatPublicBathroomsLabel,
  formatPublicSqmLabel,
} from "@/lib/listing-public-labels";
import { heatingTypeLabel, energyClassLabel } from "@/lib/listing-labels";

type DetailItem = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

function floorLabel(floor: number | null, total: number | null): string | null {
  if (floor == null && total == null) return null;
  const floorPart = floor != null ? formatFloorLabel(floor) : null;
  if (floorPart && total != null) return `${floorPart} / ${total} όροφοι κτιρίου`;
  if (floorPart) return floorPart;
  if (total != null) return `${total} όροφοι κτιρίου`;
  return null;
}

export function getListingPropertyDetails(listing: ListingWithImages): DetailItem[] {
  const bathrooms = resolveListingBathrooms(listing.bathrooms, listing.bedrooms);
  const items: DetailItem[] = [];

  if (listing.sqm) {
    items.push({ label: "Εμβαδόν", value: formatPublicSqmLabel(listing.sqm), icon: Maximize });
  }
  const floor = floorLabel(listing.floor, listing.total_floors);
  if (floor) items.push({ label: "Όροφος", value: floor, icon: Building2 });
  if (listing.year_built) {
    items.push({ label: "Έτος κατασκευής", value: String(listing.year_built), icon: Calendar });
  }
  if (listing.year_renovated) {
    items.push({ label: "Έτος ανακαίνισης", value: String(listing.year_renovated), icon: Calendar });
  }
  items.push({
    label: "Υπνοδωμάτια",
    value: formatPublicBedroomsLabel(listing.bedrooms),
    icon: Bed,
  });
  items.push({ label: "Μπάνια", value: formatPublicBathroomsLabel(bathrooms), icon: Bath });
  items.push({
    label: "Επιπλωμένο",
    value: listing.furnished ? "Ναι" : "Όχι",
    icon: Sofa,
  });
  items.push({
    label: "Μπαλκόνι",
    value: listing.has_balcony ? "Ναι" : "Όχι",
    icon: DoorOpen,
  });
  items.push({
    label: "Ασανσέρ",
    value: listing.has_elevator ? "Ναι" : "Όχι",
    icon: ArrowUpDown,
  });
  items.push({
    label: "Πάρκινγκ",
    value: listing.has_parking ? "Ναι" : "Όχι",
    icon: Car,
  });
  if (listing.heating_type) {
    items.push({
      label: "Θέρμανση",
      value: heatingTypeLabel(listing.heating_type),
      icon: Flame,
    });
  }
  if (listing.energy_class) {
    items.push({
      label: "Ενεργειακή κλάση",
      value: energyClassLabel(listing.energy_class),
      icon: Zap,
    });
  }
  items.push({
    label: "Κατοικίδια",
    value: listing.pets_allowed ? "Επιτρέπονται" : "Δεν επιτρέπονται",
    icon: PawPrint,
  });

  return items;
}

export function ListingPropertyDetails({ listing }: { listing: ListingWithImages }) {
  const items = getListingPropertyDetails(listing);

  return (
    <div className="listing-section">
      <h2 className="listing-section-title">Στοιχεία ακινήτου</h2>
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
