"use client";

import { useTransition } from "react";
import { adminMarkRegistryReviewed } from "@/lib/admin/actions";

export function AdminRegistryActions({ listingId }: { listingId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void adminMarkRegistryReviewed(listingId);
          })
        }
        className="text-gold hover:underline disabled:opacity-50"
      >
        Ελεγμένο ως προς τα βασικά στοιχεία
      </button>
    </div>
  );
}
