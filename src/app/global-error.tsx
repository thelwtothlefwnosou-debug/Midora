"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  return isLocale(match?.[1]) ? match[1] : defaultLocale;
}

function GlobalErrorContent({ reset }: { reset: () => void }) {
  const t = useTranslations("Errors.global");

  return (
    <>
      <p className="font-display text-6xl font-bold text-charcoal/10">!</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-3 max-w-md text-sm text-muted">{t("description")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-3 text-sm font-medium text-charcoal"
        >
          {t("home")}
        </Link>
      </div>
    </>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void import("@/lib/monitoring/sentry").then(({ captureException }) =>
      captureException(error, {
        pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
      })
    );
  }, [error]);

  useEffect(() => {
    const loc = getLocaleFromCookie();
    setLocale(loc);
    void import(`../../messages/${loc}.json`).then((mod) => setMessages(mod.default));
  }, []);

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-charcoal">
        {messages ? (
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GlobalErrorContent reset={reset} />
          </NextIntlClientProvider>
        ) : null}
      </body>
    </html>
  );
}
