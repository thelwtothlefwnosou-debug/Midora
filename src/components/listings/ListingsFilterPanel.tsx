"use client";

import { Bed, Bath, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { RentalTypeSearchFields } from "@/components/search/RentalTypeSearchFields";
import {
  getSearchRentalTypeOptionLabel,
  MVP_SEARCH_RENTAL_TYPE_OPTIONS,
} from "@/lib/rental-types";
import type { RentalType } from "@/lib/rental-types";
import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";
import { cn } from "@/lib/utils";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wide text-charcoal/80 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CheckRow({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (name: string, checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-1 py-1.5 hover:bg-sand/40">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(name, e.target.checked)}
        className="h-4 w-4 rounded border-border text-gold accent-gold"
      />
      <span className="text-sm text-charcoal">{label}</span>
    </label>
  );
}

function NumberField({
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
        {label}
      </span>
      <input
        type="number"
        name={name}
        value={value}
        min={0}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/50"
      />
    </label>
  );
}

type Props = {
  values: ListingsFilterValues;
  rentalType: RentalType | "";
  hideRentalTypeSection?: boolean;
  setField: (name: string, value: string) => void;
  setBoolField: (name: string, checked: boolean) => void;
};

export function ListingsFilterPanel({
  values,
  rentalType,
  hideRentalTypeSection = false,
  setField,
  setBoolField,
}: Props) {
  const t = useTranslations("Listings");
  const tf = useTranslations("Listings.filter");
  const tSearch = useTranslations("Search");
  const tListing = useTranslations("Listing");
  const tCommon = useTranslations("Common");

  const isShort = rentalType === "short_term";
  const isMonthly = rentalType === "monthly";
  const priceUnit = isShort ? tCommon("perNight") : tCommon("perMonth");

  const filterPropertyTypes = [
    { value: "apartment", label: tf("typeApartment") },
    { value: "house", label: tf("typeHouse") },
    { value: "villa", label: tf("typeVilla") },
    { value: "studio", label: tf("typeStudio") },
    { value: "other", label: tf("typeOther") },
  ] as const;

  const bedroomOptions = [
    { value: "", label: tSearch("allTypes") },
    ...Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      return { value: String(n), label: n === 10 ? "10+" : String(n) };
    }),
  ];

  const bathroomOptions = [
    { value: "", label: tSearch("allTypes") },
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
    { value: "4", label: "4+" },
  ];

  const minPrice = isShort
    ? (values.minPriceNight ?? values.minPrice ?? "")
    : (values.minMonthly ?? values.minPrice ?? "");
  const maxPrice = isShort
    ? (values.maxPriceNight ?? values.maxPrice ?? "")
    : (values.maxMonthly ?? values.maxPrice ?? "");

  function setMinPrice(v: string) {
    if (isShort) {
      setField("minPriceNight", v);
      setField("minPrice", "");
      setField("minMonthly", "");
    } else {
      setField("minMonthly", v);
      setField("minPrice", "");
      setField("minPriceNight", "");
    }
  }

  function setMaxPrice(v: string) {
    if (isShort) {
      setField("maxPriceNight", v);
      setField("maxPrice", "");
      setField("maxMonthly", "");
    } else {
      setField("maxMonthly", v);
      setField("maxPrice", "");
      setField("maxPriceNight", "");
    }
  }

  return (
    <div className="space-y-6">
      {!hideRentalTypeSection && (
        <Section title={tSearch("rentalType")}>
          <div className="grid gap-2">
            {MVP_SEARCH_RENTAL_TYPE_OPTIONS.filter((o) => o.value).map((opt) => {
              const active = rentalType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "border-gold/40 bg-[#f7f0e6] text-charcoal"
                      : "border-border bg-white text-charcoal/80 hover:border-gold/25"
                  )}
                >
                  {getSearchRentalTypeOptionLabel(opt.value, tListing)}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {rentalType && !hideRentalTypeSection && (
        <Section title={t("interestPeriod")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <RentalTypeSearchFields
              rentalType={rentalType}
              variant="compact"
              defaults={{
                interestFrom: values.interestFrom,
                interestTo: values.interestTo,
                startMonth: values.startMonth,
                durationMonths: values.durationMonths,
                guests: values.guests,
              }}
            />
          </div>
        </Section>
      )}

      <Section title={t("price")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label={`${tf("minPrice")} ${priceUnit}`}
            name={isShort ? "minPriceNight" : "minMonthly"}
            value={minPrice}
            placeholder={tf("placeholderPriceMin")}
            onChange={(_, v) => setMinPrice(v)}
          />
          <NumberField
            label={`${tf("maxPrice")} ${priceUnit}`}
            name={isShort ? "maxPriceNight" : "maxMonthly"}
            value={maxPrice}
            placeholder={tf("placeholderPriceMax")}
            onChange={(_, v) => setMaxPrice(v)}
          />
        </div>
      </Section>

      <Section title={t("propertyType")}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setField("type", "")}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm transition-colors",
              !values.type
                ? "border-gold/40 bg-[#f7f0e6]"
                : "border-border bg-white hover:border-gold/25"
            )}
          >
            {tSearch("allTypes")}
          </button>
          {filterPropertyTypes.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => setField("type", pt.value)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                values.type === pt.value
                  ? "border-gold/40 bg-[#f7f0e6]"
                  : "border-border bg-white hover:border-gold/25"
              )}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={tf("roomsBeds")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-muted uppercase">
              <Bed className="h-3 w-3" /> {t("bedrooms")}
            </span>
            <select
              name="bedrooms"
              value={values.bedrooms ?? ""}
              onChange={(e) => setField("bedrooms", e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/50"
            >
              {bedroomOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-muted uppercase">
              <Bath className="h-3 w-3" /> {tf("bathrooms")}
            </span>
            <select
              name="bathrooms"
              value={values.bathrooms ?? ""}
              onChange={(e) => setField("bathrooms", e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/50"
            >
              {bathroomOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-muted uppercase">
              <Users className="h-3 w-3" /> {tSearch("guests")}
            </span>
            <input
              type="number"
              min={1}
              value={values.guests ?? ""}
              onChange={(e) => setField("guests", e.target.value)}
              placeholder={tSearch("guestsPlaceholder")}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/50"
            />
          </label>
        </div>
      </Section>

      <Section title={tListing("amenities")}>
        <div className="grid gap-0.5 sm:grid-cols-2">
          <CheckRow
            label={tf("heatingClimate")}
            name="heating"
            checked={values.heating === "true"}
            onChange={(n, c) => setBoolField(n, c)}
          />
          <CheckRow
            label="Parking"
            name="parking"
            checked={values.parking === "true"}
            onChange={(n, c) => setBoolField(n, c)}
          />
          <CheckRow
            label={tf("furnished")}
            name="furnished"
            checked={values.furnished === "true"}
            onChange={(n, c) => setBoolField(n, c)}
          />
          <CheckRow
            label={tf("petsAllowed")}
            name="pets"
            checked={values.pets === "true"}
            onChange={(n, c) => setBoolField(n, c)}
          />
          {isMonthly && (
            <CheckRow
              label={tf("billsIncluded")}
              name="bills"
              checked={values.bills === "true"}
              onChange={(n, c) => setBoolField(n, c)}
            />
          )}
        </div>
      </Section>

      {isMonthly && (
        <Section title={tf("minStayMonths")}>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
              {tf("monthsLabel")}
            </span>
            <input
              type="number"
              min={1}
              value={values.minMonths ?? ""}
              onChange={(e) => setField("minMonths", e.target.value)}
              placeholder={tf("placeholderMonths")}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/50"
            />
          </label>
        </Section>
      )}

      <input type="hidden" name="rentalType" value={rentalType} />
    </div>
  );
}
