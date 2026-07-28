"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function IdentityVerificationModal() {
  const t = useTranslations("Owner.identityModal");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-charcoal transition-colors hover:border-gold/40 hover:bg-sand/50"
        )}
      >
        <Shield className="h-4 w-4" />
        {t("startCta")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/45"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div className="relative max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-semibold text-charcoal">{t("title")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t("description")}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-charcoal py-3 text-sm font-semibold text-white"
              >
                {t("gotIt")}
              </button>
              <button
                type="button"
                disabled
                className="flex-1 cursor-not-allowed rounded-xl border border-border py-3 text-sm font-medium text-muted opacity-60"
              >
                {t("comingSoon")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
