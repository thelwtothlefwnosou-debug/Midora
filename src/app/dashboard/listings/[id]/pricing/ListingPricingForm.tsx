"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  deleteListingPriceRule,
  saveListingPriceRule,
} from "@/lib/listing-price-rules";
import type { Listing, ListingPriceRule, Profile } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50";

type Props = {
  listing: Listing;
  rules: ListingPriceRule[];
  profile: Profile;
  email: string;
};

export function ListingPricingForm({ listing, rules, profile, email }: Props) {
  const router = useRouter();
  const [deletePending, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await saveListingPriceRule(listing.id, formData)) ?? null;
    },
    null
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-charcoal">Τιμές και διαθεσιμότητα</h2>
        <p className="mt-1 text-sm text-muted">{listing.title}</p>
      </div>
      <Link
        href={`/dashboard/listings/${listing.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Πίσω στη διαχείριση
      </Link>

      <GlassCard className="space-y-6 p-6 sm:p-8">
        <div>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Βασική τιμολόγηση
          </h2>
          <p className="mt-2 text-sm text-muted">
            Βασική τιμή: €{listing.price_per_night ?? "—"} / βράδυ
            {listing.included_guests != null && ` · έως ${listing.included_guests} άτομα`}
            {listing.extra_guest_fee_per_night != null &&
              listing.extra_guest_fee_per_night > 0 &&
              ` · + €${listing.extra_guest_fee_per_night} / επιπλέον άτομο`}
          </p>
          <p className="mt-1 text-xs text-muted">
            Η βασική τιμή ορίζεται κατά τη δημιουργία της αγγελίας. Εδώ προσθέτεις
            εποχιακές ή ειδικές περιόδους.
          </p>
        </div>

        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-charcoal">
            <Plus className="h-4 w-4 text-gold" />
            Νέα περίοδος τιμολόγησης
          </h3>
          <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted uppercase">Ετικέτα</span>
              <input name="label" placeholder="π.χ. Χριστούγεννα, Καλοκαίρι" className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Από *</span>
              <input type="date" name="start_date" required className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Έως *</span>
              <input type="date" name="end_date" required className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Τιμή / βράδυ (€) *</span>
              <input type="number" name="price_per_night" min={1} required className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Περιλαμβάνονται άτομα</span>
              <input type="number" name="included_guests" min={1} className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Επιπλέον άτομο / βράδυ (€)</span>
              <input type="number" name="extra_guest_fee_per_night" min={0} className={inputClass} />
            </label>
            <label className="block">
              <span className="text-xs text-muted uppercase">Ελάχ. νύχτες</span>
              <input type="number" name="min_stay_nights" min={1} className={inputClass} />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Αποθήκευση..." : "Προσθήκη περιόδου"}
              </button>
            </div>
          </form>
          {state?.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
          {state?.success && <p className="mt-2 text-sm text-teal">Η περίοδος αποθηκεύτηκε.</p>}
        </div>

        {rules.length > 0 && (
          <div>
            <h3 className="font-display text-base font-semibold text-charcoal">
              Ενεργές περίοδοι
            </h3>
            <ul className="mt-4 space-y-3">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/80 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-charcoal">
                      {rule.label || "Περίοδος τιμολόγησης"}
                    </p>
                    <p className="text-sm text-muted">
                      {rule.start_date} — {rule.end_date} · €{rule.price_per_night} / βράδυ
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={deletePending}
                    onClick={() => {
                      startDelete(async () => {
                        await deleteListingPriceRule(listing.id, rule.id);
                        router.refresh();
                      });
                    }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    aria-label="Διαγραφή"
                  >
                      <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Οι τιμές εμφανίζονται ενδεικτικά στην αγγελία. Η τελική τιμή και συμφωνία
          επιβεβαιώνονται απευθείας με τον αγγελιοδότη.
        </p>
      </GlassCard>
    </div>
  );
}
