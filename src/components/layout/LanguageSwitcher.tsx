"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setAppLocale } from "@/lib/actions/locale";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = true }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("LocaleSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setAppLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-charcoal/12 bg-white p-0.5 text-[12px] font-semibold tracking-wide",
        pending && "opacity-60",
        className
      )}
      role="group"
      aria-label={t("label")}
    >
      <button
        type="button"
        onClick={() => switchTo("el")}
        disabled={pending}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "el"
            ? "bg-charcoal text-white"
            : "text-charcoal/60 hover:text-charcoal"
        )}
        aria-pressed={locale === "el"}
        title={t("greek")}
      >
        {compact ? t("el") : t("greek")}
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        disabled={pending}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "en"
            ? "bg-charcoal text-white"
            : "text-charcoal/60 hover:text-charcoal"
        )}
        aria-pressed={locale === "en"}
        title={t("english")}
      >
        {compact ? t("en") : t("english")}
      </button>
    </div>
  );
}
