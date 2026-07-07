import { MIN_LISTING_DESCRIPTION_LENGTH } from "@/lib/listing-wizard-validation";
import type { ListingWithImages } from "@/lib/types";
import { propertyTypeLabel, estimateBathrooms } from "@/lib/listing-filter-helpers";
import { heatingTypeLabel, energyClassLabel } from "@/lib/listing-labels";

export function listingToAiContext(listing: ListingWithImages): string {
  const images = listing.listing_images ?? [];
  const photoCount = images.filter((i) => i.media_type !== "video").length;
  const hasVideo = images.some((i) => i.media_type === "video");
  const bathrooms = listing.bathrooms ?? estimateBathrooms(listing.bedrooms);

  const lines = [
    `id: ${listing.id}`,
    `Τίτλος: ${listing.title}`,
    `Πόλη: ${listing.city}, ${listing.area}`,
    `Τιμή: €${listing.price_monthly}/μήνα`,
    `Υ/δ: ${listing.bedrooms}`,
    `Μπάνια: ${bathrooms}`,
    listing.sqm ? `τ.μ.: ${listing.sqm}` : null,
    listing.floor != null ? `Όροφος: ${listing.floor}` : null,
    listing.total_floors != null ? `Όροφοι κτιρίου: ${listing.total_floors}` : null,
    listing.year_built ? `Έτος κατασκευής: ${listing.year_built}` : null,
    listing.year_renovated ? `Έτος ανακαίνισης: ${listing.year_renovated}` : null,
    `Τύπος: ${propertyTypeLabel(listing.property_type)}`,
    `Επιπλωμένο: ${listing.furnished ? "Ναι" : "Όχι"}`,
    `Μπαλκόνι: ${listing.has_balcony ? "Ναι" : "Όχι"}`,
    `Ασανσέρ: ${listing.has_elevator ? "Ναι" : "Όχι"}`,
    `Λογαριασμοί περιλαμβάνονται: ${listing.utilities_included ? "Ναι" : "Όχι"}`,
    `Πάρκινγκ: ${listing.has_parking ? "Ναι" : "Όχι"}`,
    listing.heating_type ? `Θέρμανση: ${heatingTypeLabel(listing.heating_type)}` : null,
    listing.energy_class ? `Ενεργ. κλάση: ${energyClassLabel(listing.energy_class)}` : null,
    `Κατοικίδια: ${listing.pets_allowed ? "Επιτρέπονται" : "Δεν επιτρέπονται"}`,
    listing.max_guests ? `Μέγ. άτομα: ${listing.max_guests}` : "Μέγ. άτομα: Δεν δηλώθηκε",
    `Καθαριότητα περιλαμβάνεται: ${listing.cleaning_included ? "Ναι" : "Όχι"}`,
    `Ελάχιστη διαμονή: ${listing.min_months} μήνας`,
    `Φωτογραφίες: ${photoCount}`,
    `Βίντεο: ${hasVideo ? "Ναι" : "Όχι"}`,
    `Περιγραφή: ${listing.description}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export function listingsToMatchContext(listings: ListingWithImages[]): string {
  return listings
    .slice(0, 50)
    .map(
      (l, i) =>
        `[${i + 1}] id=${l.id} | ${l.title} | ${l.city}, ${l.area} | €${l.price_monthly}/μήνα | ${l.bedrooms} υ/δ | parking=${l.has_parking} | pets=${l.pets_allowed} | guests=${l.max_guests ?? "n/a"} | cleaning=${l.cleaning_included} | furnished=${l.furnished} | bills=${l.utilities_included} | min_months=${l.min_months}`
    )
    .join("\n");
}

export type MatchPrefs = {
  city?: string;
  area?: string;
  maxPrice?: number;
  minBedrooms?: number;
  needsParking?: boolean;
  needsPets?: boolean;
  needsCleaning?: boolean;
  minGuests?: number;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  maxMinMonths?: number;
  durationMonths?: number;
};

export function scoreListingMatch(listing: ListingWithImages, prefs: MatchPrefs): number {
  let score = 0;

  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (prefs.city && norm(listing.city).includes(norm(prefs.city))) {
    score += 30;
  }
  if (prefs.area && norm(listing.area).includes(norm(prefs.area))) {
    score += 15;
  }
  if (prefs.maxPrice && listing.price_monthly <= prefs.maxPrice) {
    score += 25;
  } else if (prefs.maxPrice && listing.price_monthly <= prefs.maxPrice * 1.1) {
    score += 10;
  }
  if (prefs.minBedrooms && listing.bedrooms >= prefs.minBedrooms) {
    score += 20;
  }
  if (prefs.needsParking && listing.has_parking) score += 15;
  if (prefs.needsPets && listing.pets_allowed) score += 15;
  if (prefs.needsCleaning && listing.cleaning_included) score += 10;
  if (prefs.minGuests && (listing.max_guests ?? listing.bedrooms + 1) >= prefs.minGuests) {
    score += 10;
  }
  if (prefs.furnished !== undefined && listing.furnished === prefs.furnished) score += 10;
  if (
    prefs.utilitiesIncluded !== undefined &&
    listing.utilities_included === prefs.utilitiesIncluded
  ) {
    score += 10;
  }
  if (prefs.maxMinMonths && listing.min_months <= prefs.maxMinMonths) score += 10;
  if (prefs.durationMonths && listing.min_months <= prefs.durationMonths) score += 10;

  return score;
}

export function buildAreaStats(listings: ListingWithImages[]): string {
  const byCity = new Map<string, { count: number; prices: number[]; areas: Set<string> }>();

  for (const l of listings) {
    const entry = byCity.get(l.city) ?? { count: 0, prices: [], areas: new Set<string>() };
    entry.count++;
    entry.prices.push(l.price_monthly);
    entry.areas.add(l.area);
    byCity.set(l.city, entry);
  }

  return [...byCity.entries()]
    .map(([city, data]) => {
      const avg = Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length);
      const min = Math.min(...data.prices);
      const max = Math.max(...data.prices);
      return `${city}: ${data.count} αγγελίες, €${min}-${max}/μήνα (μέσος €${avg}), περιοχές: ${[...data.areas].slice(0, 8).join(", ")}`;
    })
    .join("\n");
}

export function analyzeListingQuality(listing: ListingWithImages): string {
  const issues: string[] = [];
  const images = listing.listing_images ?? [];
  const photos = images.filter((i) => i.media_type !== "video");
  const hasVideo = images.some((i) => i.media_type === "video");

  if (photos.length === 0) issues.push("Λείπουν φωτογραφίες");
  if (photos.length < 3) issues.push("Λίγες φωτογραφίες (πρότεινε 3+)");
  if (!hasVideo) issues.push("Λείπει βίντεο");
  if (!listing.description || listing.description.length < MIN_LISTING_DESCRIPTION_LENGTH) {
    issues.push("Η περιγραφή είναι πολύ σύντομη");
  }
  if (!listing.sqm) issues.push("Λείπουν τ.μ.");
  if (listing.max_guests == null) issues.push("Δεν δηλώθηκαν μέγιστα άτομα");
  if (!listing.utilities_included && !listing.description.toLowerCase().includes("λογαριασμ")) {
    issues.push("Δεν είναι σαφές τι περιλαμβάνουν οι λογαριασμοί");
  }

  return issues.length
    ? `Ελλείψεις:\n- ${issues.join("\n- ")}`
    : "Η αγγελία είναι σε καλή κατάσταση — καμία σημαντική έλλειψη.";
}
