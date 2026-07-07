import type { ListingWithImages } from "@/lib/types";
import {
  applyListingFilters,
  parseListingFilters,
} from "@/lib/listing-filters";
import type { SavedSearchFilters } from "@/lib/saved-searches";
import { getListingPublicId } from "@/lib/utils";

export function listingMatchesSavedFilters(
  listing: ListingWithImages,
  filters: SavedSearchFilters
): boolean {
  const parsed = parseListingFilters(filters);
  return applyListingFilters([listing], parsed).length > 0;
}

export function buildAlertEmailHtml(options: {
  searchName: string;
  listing: ListingWithImages;
  appUrl: string;
}): string {
  const { searchName, listing, appUrl } = options;
  const publicId = getListingPublicId(listing);
  const url = `${appUrl}/listings/${publicId}`;

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:20px;margin-bottom:8px">Νέο ακίνητο για την αναζήτησή σου</h1>
      <p style="color:#6b6560;margin-top:0">Αναζήτηση: <strong>${searchName}</strong></p>
      <div style="border:1px solid #e8e2d9;border-radius:12px;padding:16px;margin:20px 0;background:#fdfcf8">
        <p style="margin:0 0 4px;font-weight:600">${listing.title}</p>
        <p style="margin:0 0 8px;color:#6b6560">${listing.area}, ${listing.city}</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#c19a6b">€${listing.price_monthly}/μήνα</p>
      </div>
      <a href="${url}" style="display:inline-block;background:#c19a6b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">
        Δες την αγγελία
      </a>
      <p style="margin-top:24px;font-size:12px;color:#6b6560">
        Λαμβάνεις αυτό το email επειδή ενεργοποίησες ειδοποιήσεις στο Midora.
      </p>
    </div>
  `.trim();
}

export function buildAlertEmailSubject(searchName: string, listing: ListingWithImages): string {
  return `Νέο σπίτι: ${listing.area}, ${listing.city} — €${listing.price_monthly}/μήνα (${searchName})`;
}
