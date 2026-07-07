import type {
  ArrivalMethod,
  Listing,
  PolicyValue,
  SmokingPolicyValue,
} from "@/lib/types";

export const POLICY_LABELS: Record<PolicyValue, string> = {
  yes: "Ναι",
  no: "Όχι",
  on_request: "Κατόπιν συνεννόησης",
};

export const SMOKING_LABELS: Record<SmokingPolicyValue, string> = {
  yes: "Ναι",
  no: "Όχι",
  outdoor_only: "Μόνο σε εξωτερικό χώρο",
};

export const ARRIVAL_LABELS: Record<ArrivalMethod, string> = {
  host: "Υποδοχή από αγγελιοδότη",
  self: "Self check-in",
  on_request: "Κατόπιν συνεννόησης",
};

type HouseRulesListing = Pick<
  Listing,
  | "pets_policy"
  | "pets_allowed"
  | "smoking_policy"
  | "events_policy"
  | "quiet_hours_from"
  | "quiet_hours_to"
  | "check_in_from"
  | "check_in_to"
  | "check_out_until"
  | "arrival_method"
  | "commercial_photo_policy"
  | "max_guests"
>;

export function resolvePetsPolicy(listing: HouseRulesListing): PolicyValue | null {
  if (listing.pets_policy) return listing.pets_policy;
  if (listing.pets_allowed === true) return "yes";
  if (listing.pets_allowed === false) return "no";
  return null;
}

export function hasStructuredHouseRules(listing: HouseRulesListing): boolean {
  return Boolean(
    resolvePetsPolicy(listing) ||
      listing.smoking_policy ||
      listing.events_policy ||
      listing.quiet_hours_from ||
      listing.quiet_hours_to ||
      listing.check_in_from ||
      listing.check_in_to ||
      listing.check_out_until ||
      listing.arrival_method ||
      listing.commercial_photo_policy ||
      listing.max_guests
  );
}

export function houseRulesItems(listing: HouseRulesListing): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  const pets = resolvePetsPolicy(listing);
  if (pets) items.push({ label: "Επιτρέπονται κατοικίδια", value: POLICY_LABELS[pets] });
  if (listing.smoking_policy) {
    items.push({
      label: "Επιτρέπεται κάπνισμα",
      value: SMOKING_LABELS[listing.smoking_policy],
    });
  }
  if (listing.events_policy) {
    items.push({
      label: "Επιτρέπονται εκδηλώσεις",
      value: POLICY_LABELS[listing.events_policy],
    });
  }
  if (listing.quiet_hours_from || listing.quiet_hours_to) {
    items.push({
      label: "Ώρες κοινής ησυχίας",
      value: [listing.quiet_hours_from, listing.quiet_hours_to].filter(Boolean).join(" – "),
    });
  }
  if (listing.check_in_from || listing.check_in_to) {
    items.push({
      label: "Check-in",
      value: [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – "),
    });
  }
  if (listing.check_out_until) {
    items.push({ label: "Check-out", value: `έως ${listing.check_out_until}` });
  }
  if (listing.arrival_method) {
    items.push({ label: "Τρόπος άφιξης", value: ARRIVAL_LABELS[listing.arrival_method] });
  }
  if (listing.max_guests != null) {
    items.push({ label: "Μέγιστος αριθμός ατόμων", value: String(listing.max_guests) });
  }
  if (listing.commercial_photo_policy) {
    items.push({
      label: "Εμπορική φωτογράφιση/βιντεοσκόπηση",
      value: POLICY_LABELS[listing.commercial_photo_policy],
    });
  }
  return items;
}
