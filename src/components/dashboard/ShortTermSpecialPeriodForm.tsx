"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveSpecialPricingPeriod } from "@/lib/listing-pricing-actions";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  onAdded?: () => void;
};

export function ShortTermSpecialPeriodForm({ listingId, onAdded }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await saveSpecialPricingPeriod(listingId, formData);
      if (result.success) {
        onAdded?.();
        router.refresh();
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        Προσθήκη ειδικής περιόδου
      </p>
      <input
        name="name"
        required
        placeholder="π.χ. Δεκαπενταύγουστος"
        className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold/50"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="start_date"
          type="date"
          required
          className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold/50"
        />
        <input
          name="end_date"
          type="date"
          required
          className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold/50"
        />
      </div>
      <input
        name="price_per_night"
        type="number"
        min={1}
        placeholder="Τιμή / βράδυ"
        className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold/50"
      />
      <input
        name="min_stay_nights"
        type="number"
        min={1}
        placeholder="Ελάχ. νύχτες (προαιρ.)"
        className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold/50"
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="blocked" className="accent-gold" />
        Μη διαθέσιμη περίοδος
      </label>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      {state?.success && <p className="text-xs text-teal">Η περίοδος προστέθηκε.</p>}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full rounded-xl border border-border py-2 text-sm font-medium text-charcoal",
          "hover:border-gold/40 hover:bg-sand/50 disabled:opacity-50"
        )}
      >
        {pending ? "Αποθήκευση…" : "Προσθήκη περιόδου"}
      </button>
    </form>
  );
}
