"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-cream px-6 py-16 text-center">
      <p className="font-display text-2xl font-semibold text-charcoal">
        Κάτι πήγε στραβά στο dashboard
      </p>
      <p className="mt-2 max-w-md text-sm text-muted">
        Δοκίμασε ξανά. Αν το πρόβλημα συνεχίζεται, αποσυνδέσου και συνδέσου πάλι.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white shadow-[0_4px_20px_-4px_rgba(193,154,107,0.5)] transition-all hover:bg-gold-dark"
        >
          Επανάληψη
        </button>
        <Button href="/dashboard/listings/new" variant="outline">
          Νέα αγγελία
        </Button>
        <Button href="/dashboard/listings" variant="outline">
          Οι αγγελίες μου
        </Button>
      </div>
    </main>
  );
}
