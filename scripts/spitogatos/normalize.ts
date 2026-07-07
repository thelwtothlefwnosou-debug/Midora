import { isIslandGeography } from "./mainland-areas";
import type { SpitogatosImportListing, SpitogatosRawListing } from "./types";
import { AMA_LISTING_COUNT } from "./types";

function parseNum(v: string | number | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function parseImages(raw: SpitogatosRawListing): string[] {
  const urls: string[] = [];
  if (raw.mainImageUrl) urls.push(upgradeImageUrl(String(raw.mainImageUrl)));

  const imgs = raw.images;
  if (Array.isArray(imgs)) {
    for (const u of imgs) {
      if (typeof u === "string" && u.trim()) urls.push(upgradeImageUrl(u.trim()));
    }
  } else if (typeof imgs === "string" && imgs.trim()) {
    try {
      const parsed = JSON.parse(imgs) as unknown;
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          if (typeof u === "string") urls.push(upgradeImageUrl(u));
        }
      }
    } catch {
      imgs.split(",").forEach((u) => {
        const t = u.trim();
        if (t) urls.push(upgradeImageUrl(t));
      });
    }
  }

  return [...new Set(urls)].filter(Boolean);
}

/** Μεγαλύτερη ανάλυση όπου υποστηρίζεται από CDN Spitogatos. */
export function upgradeImageUrl(url: string): string {
  return url
    .replace(/300x220/gi, "1280x960")
    .replace(/220x165/gi, "1280x960")
    .replace(/_small/gi, "_large")
    .replace(/\/small\//gi, "/large/");
}

function mapPropertyType(category: string | undefined): string {
  const c = (category ?? "").toLowerCase();
  if (c.includes("studio")) return "studio";
  if (c.includes("house") || c.includes("villa") || c.includes("detached")) return "house";
  if (c.includes("maisonette")) return "house";
  return "apartment";
}

function buildDescription(raw: SpitogatosRawListing, area: string, city: string, sqm: number, beds: number): string {
  const base = (raw.description ?? "").trim();
  if (base.length >= 80) return base.slice(0, 4000);
  return [
    `Διαθέσιμο για ενοικίαση στην περιοχή ${area}, ${city}.`,
    `Ακίνητο ${sqm} τ.μ. με ${beds} υ/δ.`,
    `Πλήρως επιπλωμένο, άμεση διαθεσιμότητα.`,
    `Ιδανικό για μακροχρόνια ή βραχυχρόνια διαμονή ανάλογα με τους όρους.`,
    `Πηγή αγγελίας: Spitogatos (εσωτερικό demo dataset).`,
  ].join(" ");
}

function extractAmaFromText(text: string): string | null {
  const match = text.match(/\b(1\d{10}|\d{11})\b/);
  if (match && match[1].length === 11) return match[1];
  return null;
}

function stagingAma(seed: number): string {
  const base = 12000000000 + (seed % 7999999999);
  return String(base).slice(0, 11);
}

function inferCity(raw: SpitogatosRawListing, fallbackCity: string): string {
  return (
    (raw.city as string | undefined)?.trim() ||
    (raw.parentGeography as string | undefined)?.trim() ||
    fallbackCity
  );
}

export function normalizeSpitogatosListing(
  raw: SpitogatosRawListing,
  index: number,
  fallbackCity: string
): SpitogatosImportListing | null {
  const externalId = String(raw.adId ?? "").trim();
  if (!externalId) return null;

  const geo = [raw.geography, raw.parentGeography, raw.city, raw.region, raw.title]
    .filter(Boolean)
    .join(" ");
  if (isIslandGeography(geo)) return null;

  const category = (raw.category ?? "").toLowerCase();
  if (category.includes("land") || category.includes("commercial") || category.includes("parking")) {
    return null;
  }

  const imageUrls = parseImages(raw);
  if (imageUrls.length < 3) return null;

  const city = inferCity(raw, fallbackCity);
  const area = (raw.geography as string | undefined)?.trim() || city;
  const sqm = Math.max(25, Math.round(parseNum(raw.sqMeters, 55)));
  const bedrooms = Math.max(0, Math.round(parseNum(raw.rooms, 1)));
  const bathrooms = Math.max(1, Math.round(parseNum(raw.bathrooms, 1)));
  const priceMonthly = Math.max(250, Math.round(parseNum(raw.price, 650)));

  const withAma = index < AMA_LISTING_COUNT;
  const rentalType = withAma ? "short_term" : "monthly";
  const pricePerNight = withAma ? Math.max(35, Math.round(priceMonthly / 26)) : null;

  const descText = buildDescription(raw, area, city, sqm, bedrooms);
  const amaFromText = extractAmaFromText(`${raw.description ?? ""} ${raw.title ?? ""}`);
  const amaNumber = withAma ? amaFromText ?? stagingAma(index + parseInt(externalId.slice(-4) || "0", 10)) : null;

  const lat = parseNum(raw.latitude, 0);
  const lng = parseNum(raw.longitude, 0);
  if (!lat || !lng) return null;

  const street = (raw.street as string | undefined)?.trim() || "Οδός";
  const number = (raw.streetNumber as string | undefined)?.trim() || String((index % 90) + 1);
  const postal = (raw.postalCode as string | undefined)?.trim() || "10000";

  const title =
    (raw.title as string | undefined)?.trim() ||
    `${mapPropertyType(raw.category)} ${bedrooms || "στούντιο"} υ/δ — ${area}`;

  return {
    externalId,
    externalUrl: (raw.detailUrl as string | undefined)?.trim() || `https://www.spitogatos.gr/aggelia/${externalId}`,
    title: title.slice(0, 120),
    description: descText,
    city,
    area,
    street,
    number,
    postal,
    lat,
    lng,
    propertyType: mapPropertyType(raw.category),
    bedrooms,
    bathrooms,
    sqm,
    priceMonthly,
    pricePerNight,
    rentalType,
    withAma,
    amaNumber,
    imageUrls,
  };
}

export function normalizeSpitogatosBatch(
  rawList: SpitogatosRawListing[],
  fallbackCity = "Αθήνα"
): SpitogatosImportListing[] {
  const out: SpitogatosImportListing[] = [];
  const seen = new Set<string>();

  for (const raw of rawList) {
    const item = normalizeSpitogatosListing(raw, out.length, fallbackCity);
    if (!item || seen.has(item.externalId)) continue;
    seen.add(item.externalId);
    out.push(item);
    if (out.length >= 300) break;
  }

  return out;
}
