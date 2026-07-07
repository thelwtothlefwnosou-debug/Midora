/** Raw row from Apify Spitogatos actor (logiover/spitogatos-gr-real-estate-scraper-greece-properties-data). */
export type SpitogatosRawListing = {
  adId?: string;
  detailUrl?: string;
  title?: string;
  price?: string | number;
  priceText?: string;
  category?: string;
  listingType?: string;
  sqMeters?: string | number;
  rooms?: string | number;
  bathrooms?: string | number;
  description?: string;
  geography?: string;
  parentGeography?: string;
  city?: string;
  region?: string;
  latitude?: string | number;
  longitude?: string | number;
  mainImageUrl?: string;
  images?: string[] | string;
  imageCount?: string | number;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  [key: string]: unknown;
};

/** Normalized listing ready for Midora import. */
export type SpitogatosImportListing = {
  externalId: string;
  externalUrl: string;
  title: string;
  description: string;
  city: string;
  area: string;
  street: string;
  number: string;
  postal: string;
  lat: number;
  lng: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  priceMonthly: number;
  pricePerNight: number | null;
  rentalType: "short_term" | "monthly";
  withAma: boolean;
  amaNumber: string | null;
  imageUrls: string[];
};

export const SPIOGATOS_SEED_TAG = "spitogatos";
export const TARGET_LISTING_COUNT = 300;
export const AMA_LISTING_COUNT = 150;
