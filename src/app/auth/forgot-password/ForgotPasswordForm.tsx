"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions";
import { resolveAuthError } from "@/components/auth/auth-errors";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth.forgotPassword");
  const tErrors = useTranslations("Auth.errors");
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
        <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">{t("checkEmailTitle")}</h1>
        <p className="mt-3 text-sm text-muted">{t("checkEmailBody")}</p>
        <Link href="/login" className="mt-6 inline-block text-sm text-gold hover:underline">
          {t("backToSignIn")}
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
        {t("back")}
      </Link>

      <h1 className="font-display text-2xl font-bold text-charcoal">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

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
        {state?.error && (
          <p className="text-sm text-red-400">{resolveAuthError(tErrors, state.error)}</p>
        )}
        <Button type="submit" size="lg" className="w-full">
          {pending ? t("sending") : t("sendLink")}
        </Button>
      </form>
    </GlassCard>
  );
}
