"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { completeProfile } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function CompleteProfileForm({
  defaultFullName = "",
  defaultPhone = "",
}: {
  defaultFullName?: string;
  defaultPhone?: string;
}) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard/profile";

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("redirect", nextPath);
      return (await completeProfile(formData)) ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <GlassCard glow className="w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold text-charcoal">
          Ολοκλήρωση προφίλ
        </h1>
        <p className="mt-2 text-sm text-muted">
          Χρειαζόμαστε το τηλέφωνό σου ώστε οι ενδιαφερόμενοι να μπορούν να
          επικοινωνήσουν μαζί σου για τις αγγελίες σου.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="text-xs text-muted uppercase">Ονοματεπώνυμο</label>
            <input
              name="full_name"
              required
              defaultValue={defaultFullName}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">Τηλέφωνο</label>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={defaultPhone}
              placeholder="+30 69..."
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}
          <Button type="submit" size="lg" className="w-full">
            {pending ? "Αποθήκευση..." : "Συνέχεια στον λογαριασμό"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
