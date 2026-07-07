"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@/lib/monitoring/sentry").then(({ captureException }) =>
      captureException(error, { pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined })
    );
  }, [error]);

  return (
    <html lang="el">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-charcoal">
        <p className="font-display text-6xl font-bold text-charcoal/10">!</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Κάτι πήγε στραβά</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          Προέκυψε απρόσμενο σφάλμα. Δοκίμασε να ανανεώσεις τη σελίδα ή επέστρεψε στην αρχική.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white"
          >
            Δοκίμασε ξανά
          </button>
          <Link
            href="/"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-charcoal"
          >
            Αρχική
          </Link>
        </div>
      </body>
    </html>
  );
}
