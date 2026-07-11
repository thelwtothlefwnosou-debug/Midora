import type { ArrivalMethod, Listing } from "@/lib/types";
import { ARRIVAL_LABELS } from "@/lib/house-rules";

type ArrivalListing = Pick<
  Listing,
  "check_in_from" | "check_in_to" | "check_out_until" | "arrival_method"
>;

export function hasArrivalInfo(listing: ArrivalListing): boolean {
  return Boolean(
    listing.check_in_from ||
      listing.check_in_to ||
      listing.check_out_until ||
      listing.arrival_method
  );
}

export function arrivalInfoItems(
  listing: ArrivalListing
): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];

  if (listing.check_in_from || listing.check_in_to) {
    const range = [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – ");
    items.push({ label: "Check-in", value: range });
  }
  if (listing.check_out_until) {
    items.push({ label: "Check-out", value: `έως ${listing.check_out_until}` });
  }
  if (listing.arrival_method) {
    items.push({
      label: "Τρόπος άφιξης",
      value: ARRIVAL_LABELS[listing.arrival_method as ArrivalMethod],
    });
  }

  return items;
}
