import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ListingWithImages } from "@/lib/types";
import {
  estimateBathrooms,
  formatFloorLabel,
  getPropertyTypeLabel,
} from "@/lib/listing-filter-helpers";
import { getHeatingTypeLabel, getEnergyClassLabel } from "@/lib/listing-labels";
import { getListingPublicId } from "@/lib/utils";

type Row = {
  label: string;
  values: (string | number | boolean | null | undefined)[];
};

type Translator = (key: string, values?: Record<string, string | number>) => string;

function yesNo(v: boolean | null | undefined, yes: string, no: string) {
  if (v == null) return "—";
  return v ? yes : no;
}

function buildRows(
  listings: ListingWithImages[],
  t: Translator,
  tPropertyTypes: Translator,
  tLabels: Translator,
  tCommon: Translator
): Row[] {
  const yes = tCommon("yes");
  const no = tCommon("no");
  return [
    {
      label: t("pricePerMonth"),
      values: listings.map((l) => `€${l.price_monthly}`),
    },
    { label: t("city"), values: listings.map((l) => l.city) },
    { label: t("area"), values: listings.map((l) => l.area) },
    {
      label: t("propertyType"),
      values: listings.map((l) => getPropertyTypeLabel(l.property_type, tPropertyTypes)),
    },
    { label: t("sqm"), values: listings.map((l) => l.sqm ?? "—") },
    { label: t("bedrooms"), values: listings.map((l) => l.bedrooms) },
    {
      label: t("bathrooms"),
      values: listings.map((l) => l.bathrooms ?? estimateBathrooms(l.bedrooms)),
    },
    { label: t("floor"), values: listings.map((l) => formatFloorLabel(l.floor) ?? "—") },
    { label: t("totalFloors"), values: listings.map((l) => l.total_floors ?? "—") },
    { label: t("yearBuilt"), values: listings.map((l) => l.year_built ?? "—") },
    { label: t("furnished"), values: listings.map((l) => yesNo(l.furnished, yes, no)) },
    { label: t("balcony"), values: listings.map((l) => yesNo(l.has_balcony, yes, no)) },
    { label: t("elevator"), values: listings.map((l) => yesNo(l.has_elevator, yes, no)) },
    { label: t("parking"), values: listings.map((l) => yesNo(l.has_parking, yes, no)) },
    {
      label: t("heating"),
      values: listings.map((l) => getHeatingTypeLabel(l.heating_type, tLabels)),
    },
    {
      label: t("energyClass"),
      values: listings.map((l) => getEnergyClassLabel(l.energy_class, tLabels)),
    },
    { label: t("pets"), values: listings.map((l) => yesNo(l.pets_allowed, yes, no)) },
    {
      label: t("utilities"),
      values: listings.map((l) => yesNo(l.utilities_included, yes, no)),
    },
    { label: t("minMonths"), values: listings.map((l) => l.min_months) },
  ];
}

export async function FavoritesCompareTable({ listings }: { listings: ListingWithImages[] }) {
  const [t, tPropertyTypes, tLabels, tCommon] = await Promise.all([
    getTranslations("Favorites.table"),
    getTranslations("PropertyTypes"),
    getTranslations("Listing.labels"),
    getTranslations("Common"),
  ]);
  const rows = buildRows(listings, t, tPropertyTypes, tLabels, tCommon);

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-sand/40">
            <th className="p-4 text-left text-xs font-medium tracking-wider text-muted uppercase">
              {t("feature")}
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
