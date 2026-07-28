import type { ListingWithImages } from "@/lib/types";

import {

  applyListingFilters,

  parseListingFilters,

} from "@/lib/listing-filters";

import type { SavedSearchFilters } from "@/lib/saved-searches";

import { getListingPublicId } from "@/lib/utils";

import { intlLocale, pickLocale } from "@/lib/locale-fallbacks";

import { listingRentalType } from "@/lib/rental-types";



export function listingMatchesSavedFilters(

  listing: ListingWithImages,

  filters: SavedSearchFilters

): boolean {

  const parsed = parseListingFilters(filters);

  return applyListingFilters([listing], parsed).length > 0;

}



function formatAlertPrice(listing: ListingWithImages, locale?: string): string {

  const tag = intlLocale(locale);

  const rt = listingRentalType(listing);

  if (rt === "short_term" && listing.price_per_night) {

    const perNight = pickLocale(locale, "/βράδυ", "/night");

    return `€${listing.price_per_night.toLocaleString(tag)}${perNight}`;

  }

  const perMonth = pickLocale(locale, "/μήνα", "/month");

  return `€${listing.price_monthly.toLocaleString(tag)}${perMonth}`;

}



export function buildAlertEmailHtml(options: {

  searchName: string;

  listing: ListingWithImages;

  appUrl: string;

  locale?: string;

}): string {

  const { searchName, listing, appUrl, locale } = options;

  const publicId = getListingPublicId(listing);

  const url = `${appUrl}/listings/${publicId}`;

  const price = formatAlertPrice(listing, locale);



  const heading = pickLocale(locale, "Νέο ακίνητο για την αναζήτησή σου", "New listing for your search");

  const searchLabel = pickLocale(locale, "Αναζήτηση", "Search");

  const cta = pickLocale(locale, "Δες την αγγελία", "View listing");

  const footer = pickLocale(

    locale,

    "Λαμβάνεις αυτό το email επειδή ενεργοποίησες ειδοποιήσεις στο Midora.",

    "You receive this email because you enabled alerts on Midora."

  );



  return `

    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">

      <h1 style="font-size:20px;margin-bottom:8px">${heading}</h1>

      <p style="color:#6b6560;margin-top:0">${searchLabel}: <strong>${searchName}</strong></p>

      <div style="border:1px solid #e8e2d9;border-radius:12px;padding:16px;margin:20px 0;background:#fdfcf8">

        <p style="margin:0 0 4px;font-weight:600">${listing.title}</p>

        <p style="margin:0 0 8px;color:#6b6560">${listing.area}, ${listing.city}</p>

        <p style="margin:0;font-size:18px;font-weight:700;color:#c19a6b">${price}</p>

      </div>

      <a href="${url}" style="display:inline-block;background:#c19a6b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">

        ${cta}

      </a>

      <p style="margin-top:24px;font-size:12px;color:#6b6560">

        ${footer}

      </p>

    </div>

  `.trim();

}



export function buildAlertEmailSubject(

  searchName: string,

  listing: ListingWithImages,

  locale?: string

): string {

  const price = formatAlertPrice(listing, locale);

  return pickLocale(

    locale,

    `Νέο σπίτι: ${listing.area}, ${listing.city} — ${price} (${searchName})`,

    `New home: ${listing.area}, ${listing.city} — ${price} (${searchName})`

  );

}


