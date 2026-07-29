"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Owner.errorPage");

  useEffect(() => {
    console.error("[dashboard]", error.digest ?? error.message, error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-cream px-6 py-16 text-center">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white px-6 py-10 shadow-soft sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sand ring-1 ring-charcoal/6">
          <AlertTriangle className="h-6 w-6 text-gold-dark" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-charcoal">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">{t("body")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-charcoal/90"
          >
            {t("retry")}
          </button>
          <Button href="/dashboard/listings" variant="outline">
            {t("myListings")}
          </Button>
          <Button href="/" variant="outline">
            {t("home")}
          </Button>
        </div>
      </div>
    </main>
  );
}
