import type { AreaCatalogEntry } from "../../src/lib/data/greek-areas";
import { getKnownCityCenter, getKnownSuburbCenter } from "../../src/lib/geocoding/city-centers";
import { getMainlandCatalog } from "./mainland-catalog";
import { photosForListing, buildPhotoPool } from "./pexels-pool";

export type GeneratedGreeceListing = {
  slug: string;
  title: string;
  description: string;
  city: string;
  area: string;
  region: string;
  street: string;
  number: string;
  postal: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  priceMonthly: number;
  pricePerNight: number | null;
  rentalType: "short_term" | "monthly";
  withAma: boolean;
  amaNumber: string | null;
  propertyType: string;
  photoUrls: string[];
};

const STREETS = [
  "Ιωαννίνων",
  "Βασιλέως Γεωργίου",
  "Καραολή και Δημητρίου",
  "Μητροπόλεως",
  "Ερμού",
  "Πατησίων",
  "Κηφισίας",
  "Λεωφόρος Συγγρού",
  "Αγίας Σοφίας",
  "Θεσσαλονίκης",
  "Πλατείας",
  "Μακεδονίας",
  "Ελευθερίου Βενιζέλου",
  "Κανάρη",
  "Δημοκρατίας",
];

const TITLES = [
  "Φωτεινό διαμέρισμα",
  "Ανακαινισμένο ρετιρέ",
  "Μοντέρνο loft",
  "Οικογενειακό διαμέρισμα",
  "Studio κέντρου",
  "Διαμέρισμα με μπαλκόνι",
  "Άνετο {beds} υ/δ",
  "Πλήρως επιπλωμένο",
  "Ήσυχο διαμέρισμα",
  "Νεόκτιστο διαμέρισμα",
];

function coordsFor(city: string, area: string, seed: number): { lat: number; lng: number } {
  const suburb = getKnownSuburbCenter(area, city);
  const base = suburb ?? getKnownCityCenter(city);
  if (!base) return { lat: 39.0 + (seed % 50) * 0.01, lng: 22.0 + (seed % 50) * 0.01 };
  const jitter = 0.004 * ((seed % 17) - 8);
  return {
    lat: base.lat + jitter * 0.7,
    lng: base.lng + jitter,
  };
}

function stagingAma(seed: number): string {
  return String(12000000000 + (seed % 7999999999)).slice(0, 11);
}

function buildDescription(
  title: string,
  area: string,
  city: string,
  sqm: number,
  beds: number,
  withAma: boolean
): string {
  return [
    `${title} στην περιοχή ${area}, ${city}.`,
    `Συνολική επιφάνεια ${sqm} τ.μ., ${beds || "στούντιο"} υπνοδωμάτια.`,
    "Πλήρως επιπλωμένο, κλιματισμός, πλυντήριο, γρήγιρο WiFi.",
    withAma
      ? "Διαθέσιμο για βραχυχρόνια διαμονή με καταχωρημένο ΑΜΑ."
      : "Ιδανικό για μακροχρόνια μίσθωση — χωρίς απαίτηση ΑΜΑ.",
    "Οι φωτογραφίες είναι πραγματικές εικόνες εσωτερικού χώρου (Pexels).",
  ].join(" ");
}

export async function generateGreeceListings(count = 300): Promise<GeneratedGreeceListing[]> {
  const catalog = getMainlandCatalog();
  if (!catalog.length) throw new Error("Empty mainland catalog");

  const photoPool = await buildPhotoPool(Math.max(count * 6, 400));
  const perListing = 6;
  const out: GeneratedGreeceListing[] = [];

  for (let i = 0; i < count; i++) {
    const loc: AreaCatalogEntry = catalog[i % catalog.length];
    const withAma = i < 150;
    const rentalType = withAma ? "short_term" : "monthly";
    const bedrooms = (i % 4) + (i % 7 === 0 ? 0 : 1);
    const sqm = 38 + (i % 9) * 12 + bedrooms * 8;
    const priceMonthly = 420 + (i % 20) * 55 + bedrooms * 90;
    const pricePerNight = withAma ? Math.max(40, Math.round(priceMonthly / 24)) : null;
    const bedsLabel = bedrooms === 0 ? "στούντιο" : `${bedrooms} υ/δ`;
    const titleBase = TITLES[i % TITLES.length].replace("{beds}", String(bedrooms));
    const title = `${titleBase} — ${loc.area}`;
    const { lat, lng } = coordsFor(loc.city, loc.area, i);
    const street = STREETS[i % STREETS.length];
    const number = String((i % 88) + 2);

    out.push({
      slug: `greece-rental-${String(i + 1).padStart(3, "0")}`,
      title: title.slice(0, 100),
      description: buildDescription(titleBase, loc.area, loc.city, sqm, bedrooms, withAma),
      city: loc.city,
      area: loc.area,
      region: loc.region,
      street,
      number,
      postal: String(10000 + (i % 899)),
      lat,
      lng,
      bedrooms,
      bathrooms: Math.max(1, Math.min(3, bedrooms)),
      sqm,
      priceMonthly,
      pricePerNight,
      rentalType,
      withAma,
      amaNumber: withAma ? stagingAma(i + 1) : null,
      propertyType: bedrooms === 0 ? "studio" : bedrooms >= 3 ? "house" : "apartment",
      photoUrls: photosForListing(photoPool, i, perListing),
    });
  }

  return out;
}
