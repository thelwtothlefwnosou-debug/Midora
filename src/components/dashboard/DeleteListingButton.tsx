"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteListing } from "@/lib/actions";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteListing(listingId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="flex items-center gap-1 text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
        Διαγραφή
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Κλείσιμο"
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => !pending && setOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-muted hover:bg-sand"
              aria-label="Κλείσιμο"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-lg font-semibold text-charcoal">
              Διαγραφή αγγελίας;
            </h3>
            <p className="mt-2 text-sm text-muted">
              Η ενέργεια δεν μπορεί να αναιρεθεί. Θα διαγραφούν και οι φωτογραφίες της
              αγγελίας.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-sand disabled:opacity-50"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {pending ? "Διαγραφή..." : "Ναι, διαγραφή"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
