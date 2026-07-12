"use client";

import { GREEK_CITIES, PROPERTY_TYPES } from "@/lib/types";
import type { ListingWithImages } from "@/lib/types";
import { HEATING_TYPES, ENERGY_CLASSES } from "@/lib/listing-labels";
import { listingRentalType } from "@/lib/rental-types";

type ListingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  pending: boolean;
  error?: string;
  submitLabel: string;
  listing?: ListingWithImages;
};

export function ListingForm({
  action,
  pending,
  error,
  submitLabel,
  listing,
}: ListingFormProps) {
  const rentalType = listingRentalType(listing ?? { rental_type: "monthly" });
  const isShortTerm = rentalType === "short_term";

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="text-xs text-muted uppercase">Τίτλος *</label>
        <input
          name="title"
          required
          defaultValue={listing?.title}
          placeholder="π.χ. Διαμέρισμα 2 υ/δ στο Κουκάκι"
          className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      <div>
        <label className="text-xs text-muted uppercase">Περιγραφή (Ελληνικά) *</label>
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={listing?.description}
          className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      <div>
        <label className="text-xs text-muted uppercase">
          Περιγραφή (English) — προαιρετικό
        </label>
        <textarea
          name="description_en"
          rows={5}
          defaultValue={listing?.description_en ?? ""}
          placeholder="English description for international tenants..."
          className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted uppercase">Πόλη *</label>
          <select
            name="city"
            required
            defaultValue={listing?.city}
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none"
          >
            <option value="">Επίλεξε...</option>
            {GREEK_CITIES.map((c) => (
              <option key={c} value={c} className="bg-white">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted uppercase">Περιοχή *</label>
          <input
            name="area"
            required
            defaultValue={listing?.area}
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted uppercase">
          Διεύθυνση (για χάρτη — δεν εμφανίζεται δημόσια)
        </label>
        <input
          name="address"
          defaultValue={listing?.address ?? ""}
          className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs text-muted uppercase">
            {isShortTerm ? "Τιμή / βράδυ *" : "Τιμή / μήνα *"}
          </label>
          {isShortTerm ? (
            <input
              name="price_per_night"
              type="number"
              required
              min={1}
              defaultValue={listing?.price_per_night ?? listing?.price_monthly}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          ) : (
            <input
              name="price_monthly"
              type="number"
              required
              min={1}
              defaultValue={listing?.price_monthly}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          )}
        </div>
        <div>
          <label className="text-xs text-muted uppercase">Υ/Δ *</label>
          <input
            name="bedrooms"
            type="number"
            required
            min={0}
            defaultValue={listing?.bedrooms ?? 1}
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted uppercase">Μπάνια</label>
          <input
            name="bathrooms"
            type="number"
            min={0}
            defaultValue={listing?.bathrooms ?? ""}
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
          />
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold text-gold">Στοιχεία ακινήτου</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-muted uppercase">τ.μ.</label>
            <input
              name="sqm"
              type="number"
              min={1}
              defaultValue={listing?.sqm ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Όροφος</label>
            <input
              name="floor"
              type="number"
              defaultValue={listing?.floor ?? ""}
              placeholder="π.χ. 3"
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Συνολικοί όροφοι</label>
            <input
              name="total_floors"
              type="number"
              min={1}
              defaultValue={listing?.total_floors ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Έτος κατασκευής</label>
            <input
              name="year_built"
              type="number"
              min={1800}
              max={2100}
              defaultValue={listing?.year_built ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Έτος ανακαίνισης</label>
            <input
              name="year_renovated"
              type="number"
              min={1800}
              max={2100}
              defaultValue={listing?.year_renovated ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Τύπος θέρμανσης</label>
            <select
              name="heating_type"
              defaultValue={listing?.heating_type ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none"
            >
              {HEATING_TYPES.map((t) => (
                <option
                  key={t.value === "" ? "heating-unset" : t.value}
                  value={t.value}
                  className="bg-white"
                >
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Ενεργειακή κλάση</label>
            <select
              name="energy_class"
              defaultValue={listing?.energy_class ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none"
            >
              {ENERGY_CLASSES.map((t) => (
                <option
                  key={t.value === "" ? "energy-unset" : t.value}
                  value={t.value}
                  className="bg-white"
                >
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted uppercase">Τύπος</label>
          <select
            name="property_type"
            defaultValue={listing?.property_type ?? "apartment"}
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-white">
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted uppercase">Ελάχιστη διάρκεια</label>
          {isShortTerm ? (
            <select
              name="min_months"
              defaultValue={listing?.min_months ?? 1}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none"
            >
              <option value={1} className="bg-white">
                1 νύχτα
              </option>
              <option value={3} className="bg-white">
                3 νύχτες
              </option>
              <option value={7} className="bg-white">
                7 νύχτες
              </option>
            </select>
          ) : (
            <select
              name="min_months"
              defaultValue={listing?.min_months ?? 1}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none"
            >
              <option value={1} className="bg-white">
                1 μήνας
              </option>
              <option value={3} className="bg-white">
                3 μήνες
              </option>
              <option value={6} className="bg-white">
                6 μήνες
              </option>
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input
            type="checkbox"
            name="cleaning_included"
            defaultChecked={listing?.cleaning_included}
            className="accent-gold"
          />
          Η καθαριότητα περιλαμβάνεται
        </label>
      </div>

      <div>
        <label className="text-xs text-muted uppercase">Μέγ. άτομα</label>
        <input
          name="max_guests"
          type="number"
          min={1}
          defaultValue={listing?.max_guests ?? ""}
          placeholder="π.χ. 4"
          className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      <div>
        <label className="text-xs text-muted uppercase">Κανόνες σπιτιού (προαιρετικό)</label>
        <textarea
          name="house_rules"
          rows={3}
          placeholder="π.χ. Χωρίς κάπνισμα, ήσυχες ώρες μετά τις 23:00"
          className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-gold to-gold-light py-4 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
