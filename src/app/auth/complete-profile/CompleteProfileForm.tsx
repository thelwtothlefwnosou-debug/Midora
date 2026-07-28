"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { completeProfile } from "@/lib/actions";
import { resolveAuthError } from "@/components/auth/auth-errors";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function CompleteProfileForm({
  defaultFullName = "",
  defaultPhone = "",
  nextPath = "/dashboard/listings",
}: {
  defaultFullName?: string;
  defaultPhone?: string;
  nextPath?: string;
}) {
  const t = useTranslations("Auth.completeProfile");
  const tErrors = useTranslations("Auth.errors");
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
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="text-xs text-muted uppercase">{t("fullName")}</label>
            <input
              name="full_name"
              required
              defaultValue={defaultFullName}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase">{t("phone")}</label>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={defaultPhone}
              placeholder={t("phonePlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-sand/50 px-4 py-3 text-charcoal outline-none focus:border-gold/50"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-400">
              {resolveAuthError(tErrors, state.error)}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full">
            {pending ? t("saving") : t("continue")}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
