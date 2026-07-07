"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await updatePassword(formData)) ?? null;
    },
    null
  );

  return (
    <GlassCard glow className="w-full max-w-md p-8">
      <h1 className="font-display text-2xl font-bold text-charcoal">Νέος κωδικός</h1>
      <p className="mt-2 text-sm text-muted">Διάλεξε νέο κωδικό για τον λογαριασμό σου.</p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className="text-xs text-muted uppercase">Νέος κωδικός</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
          />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full">
          {pending ? "Αποθήκευση..." : "Αποθήκευση κωδικού"}
        </Button>
      </form>
    </GlassCard>
  );
}
