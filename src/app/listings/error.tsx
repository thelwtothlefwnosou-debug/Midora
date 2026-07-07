"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function ListingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[listings]", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-cream px-6 pt-24 pb-16 text-center">
        <p className="font-display text-2xl font-semibold text-charcoal">
          Δεν ήταν δυνατή η φόρτωση των ακινήτων
        </p>
        <p className="mt-2 max-w-md text-sm text-muted">
          Δοκίμασε ξανά σε λίγα δευτερόλεπτα. Αν το πρόβλημα συνεχίζεται, έλεγξε τη
          σύνδεσή σου.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-white shadow-[0_4px_20px_-4px_rgba(193,154,107,0.5)] transition-all hover:bg-gold-dark"
          >
            Επανάληψη
          </button>
          <Button href="/listings" variant="outline">
            Δες όλα τα ακίνητα
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
