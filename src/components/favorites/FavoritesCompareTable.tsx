import Link from "next/link";
import type { ListingWithImages } from "@/lib/types";
import { estimateBathrooms, propertyTypeLabel } from "@/lib/listing-filter-helpers";
import { heatingTypeLabel, energyClassLabel } from "@/lib/listing-labels";
import { getListingPublicId } from "@/lib/utils";

type Row = {
  label: string;
  values: (string | number | boolean | null | undefined)[];
};

function yesNo(v: boolean | null | undefined) {
  if (v == null) return "—";
  return v ? "Ναι" : "Όχι";
}

function buildRows(listings: ListingWithImages[]): Row[] {
  return [
    {
      label: "Τιμή / μήνα",
      values: listings.map((l) => `€${l.price_monthly}`),
    },
    { label: "Πόλη", values: listings.map((l) => l.city) },
    { label: "Περιοχή", values: listings.map((l) => l.area) },
    { label: "Τύπος", values: listings.map((l) => propertyTypeLabel(l.property_type)) },
    { label: "τ.μ.", values: listings.map((l) => l.sqm ?? "—") },
    { label: "Υ/δ", values: listings.map((l) => l.bedrooms) },
    {
      label: "Μπάνια",
      values: listings.map((l) => l.bathrooms ?? estimateBathrooms(l.bedrooms)),
    },
    { label: "Όροφος", values: listings.map((l) => l.floor ?? "—") },
    { label: "Όροφοι κτιρίου", values: listings.map((l) => l.total_floors ?? "—") },
    { label: "Έτος κατασκευής", values: listings.map((l) => l.year_built ?? "—") },
    { label: "Επιπλωμένο", values: listings.map((l) => yesNo(l.furnished)) },
    { label: "Μπαλκόνι", values: listings.map((l) => yesNo(l.has_balcony)) },
    { label: "Ασανσέρ", values: listings.map((l) => yesNo(l.has_elevator)) },
    { label: "Πάρκινγκ", values: listings.map((l) => yesNo(l.has_parking)) },
    {
      label: "Θέρμανση",
      values: listings.map((l) => heatingTypeLabel(l.heating_type)),
    },
    {
      label: "Ενεργ. κλάση",
      values: listings.map((l) => energyClassLabel(l.energy_class)),
    },
    { label: "Κατοικίδια", values: listings.map((l) => yesNo(l.pets_allowed)) },
    { label: "Λογαριασμοί", values: listings.map((l) => yesNo(l.utilities_included)) },
    { label: "Ελάχ. μήνες", values: listings.map((l) => l.min_months) },
  ];
}

export function FavoritesCompareTable({ listings }: { listings: ListingWithImages[] }) {
  const rows = buildRows(listings);

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-sand/40">
            <th className="p-4 text-left text-xs font-medium tracking-wider text-muted uppercase">
              Χαρακτηριστικό
            </th>
            {listings.map((l) => (
              <th key={l.id} className="max-w-[180px] p-4 text-left align-top">
                <Link
                  href={`/listings/${getListingPublicId(l)}`}
                  className="font-display text-sm font-semibold text-charcoal hover:text-gold line-clamp-2"
                >
                  {l.title}
                </Link>
                <p className="mt-1 font-display text-lg font-bold text-gold">
                  €{l.price_monthly}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={i % 2 === 0 ? "bg-transparent" : "bg-sand/30"}
            >
              <td className="border-t border-border p-4 text-muted">{row.label}</td>
              {row.values.map((val, j) => (
                <td key={j} className="border-t border-border p-4 text-charcoal/80">
                  {String(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
