"use client";

import { useTransition } from "react";
import { adminUpdateVerificationStatus } from "@/lib/admin/actions";

export function AdminVerificationActions({ listingId }: { listingId: string }) {
  const [pending, startTransition] = useTransition();

  const run = (field: "advertiser" | "property", status: string) =>
    startTransition(() => {
      void adminUpdateVerificationStatus(listingId, field, status);
    });

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("advertiser", "verified")}
        className="text-gold hover:underline disabled:opacity-50"
      >
        Έγκριση αγγελιοδότη
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("property", "verified")}
        className="text-gold hover:underline disabled:opacity-50"
      >
        Έγκριση ακινήτου
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("advertiser", "needs_review")}
        className="text-muted hover:underline disabled:opacity-50"
      >
        Ζήτα αλλαγές
      </button>
    </div>
  );
}
