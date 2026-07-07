import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getListingPublicId(listing: { id: string; slug?: string | null }) {
  const slug = listing.slug?.trim();
  return slug || listing.id;
}
