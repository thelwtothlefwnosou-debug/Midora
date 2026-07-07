"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await requestPasswordReset(formData)) ?? null;
    },
    null
  );

  if (state?.success) {
    return (
      <GlassCard glow className="w-full max-w-md p-8 text-center">
        <Mail className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Έλεγξε το email σου</h1>
        <p className="mt-3 text-sm text-muted">
          Αν υπάρχει λογαριασμός με αυτό το email, θα λάβεις σύνδεσμο για νέο κωδικό.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-gold hover:underline">
          Πίσω στη σύνδεση
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard glow className="w-full max-w-md p-8">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω
      </Link>

      <h1 className="font-display text-2xl font-bold text-charcoal">Ξέχασες τον κωδικό;</h1>
      <p className="mt-2 text-sm text-muted">
        Βάλε το email σου και θα σου στείλουμε σύνδεσμο επαναφοράς.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className="text-xs text-muted uppercase">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
          />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full">
          {pending ? "Αποστολή..." : "Αποστολή συνδέσμου"}
        </Button>
      </form>
    </GlassCard>
  );
}
