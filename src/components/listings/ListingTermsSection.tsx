"use client";

import { useListingRentalMode } from "@/components/listings/ListingRentalModeContext";
import type { ListingWithImages } from "@/lib/types";
import { COPY } from "@/lib/copy";
import {
  formatPublicMinStayForMode,
  publicMinStayHeading,
  resolveMonthlyIncludesBills,
} from "@/lib/listing-rental-modes";

export function ListingTermsSection({ listing }: { listing: ListingWithImages }) {
  const { mode } = useListingRentalMode();

  const items: string[] = [];

  if (mode === "short_term") {
    items.push(
      `${publicMinStayHeading(mode)}: ${formatPublicMinStayForMode(listing, mode)}`
    );
    if (listing.included_guests != null) {
      items.push(`Άτομα που περιλαμβάνονται στην τιμή: ${listing.included_guests}`);
    }
    if (listing.extra_guest_fee_per_night != null) {
      items.push(
        `Χρέωση επιπλέον ατόμου: €${listing.extra_guest_fee_per_night.toLocaleString("el-GR")} / βράδυ`
      );
    }
    items.push(
      listing.pets_allowed ? "Κατοικίδια επιτρέπονται" : "Κατοικίδια δεν επιτρέπονται"
    );
    items.push(
      listing.cleaning_included ? COPY.cleaningIncluded : COPY.cleaningNotIncluded
    );
  } else {
    items.push(
      `${publicMinStayHeading(mode)}: ${formatPublicMinStayForMode(listing, mode)}`
    );
    items.push(
      resolveMonthlyIncludesBills(listing)
        ? COPY.utilitiesIncluded
        : COPY.utilitiesNotIncluded
    );
    items.push(
      listing.pets_allowed ? "Κατοικίδια επιτρέπονται" : "Κατοικίδια δεν επιτρέπονται"
    );
    items.push(
      listing.cleaning_included ? COPY.cleaningIncluded : COPY.cleaningNotIncluded
    );
    items.push(listing.furnished ? "Επιπλωμένο" : "Αμίπλωτο");
    if (listing.monthly_terms?.trim()) {
      items.push(listing.monthly_terms.trim());
    }
  }

  return (
    <section className="listing-section">
      <h2 className="listing-section-title">Όροι & πληροφορίες διαμονής</h2>
      <p className="listing-meta mt-3">
        Σαφή στοιχεία πριν στείλεις ενδιαφέρον. Η τελική συμφωνία γίνεται με τον
        ιδιοκτήτη.
      </p>
      <ul className="listing-card mt-5 space-y-2 p-5 text-sm text-charcoal/85">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-gold">•</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
