"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { submitListingReport } from "@/lib/actions";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  "Ψεύτικη αγγελία",
  "Λάθος στοιχεία",
  "Ύποπτη συμπεριφορά",
  "Πρόβλημα με ΑΜΑ",
  "Άλλο",
] as const;

type Props = {
  listingTitle: string;
  listingId: string;
  className?: string;
};

export function ListingReportButton({ listingTitle, listingId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function resetAndClose() {
    setOpen(false);
    setSent(false);
    setError(null);
    setDescription("");
    setEmail("");
    setReason(REPORT_REASONS[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("listing_title", listingTitle);
    fd.set("reason", reason);
    if (description.trim()) fd.set("description", description.trim());
    if (email.trim()) fd.set("reporter_email", email.trim());

    startTransition(async () => {
      const result = await submitListingReport(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-charcoal",
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        Αναφορά αγγελίας
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/45"
            aria-label="Κλείσιμο"
            onClick={resetAndClose}
          />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <h2 id="report-modal-title" className="font-display text-lg font-semibold text-charcoal">
              {sent ? "Η αναφορά καταχωρήθηκε" : "Αναφορά αγγελίας"}
            </h2>
            {!sent && (
              <p className="mt-1 text-sm text-muted line-clamp-1">{listingTitle}</p>
            )}

            {sent ? (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-charcoal/75">{COPY.reportSuccessText}</p>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="mt-5 w-full rounded-xl bg-charcoal py-3 text-sm font-semibold text-white"
                >
                  Κλείσιμο
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <fieldset>
                  <legend className="text-xs font-medium tracking-wide text-muted uppercase">
                    Λόγος αναφοράς
                  </legend>
                  <div className="mt-2 space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="accent-gold"
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="text-xs font-medium tracking-wide text-muted uppercase">
                    Περιγραφή προβλήματος
                  </span>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium tracking-wide text-muted uppercase">
                    Email επικοινωνίας (προαιρετικά)
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="min-h-10 flex-1 rounded-xl border border-border text-sm font-medium"
                  >
                    Ακύρωση
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="min-h-10 flex-1 rounded-xl bg-charcoal text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pending ? "Αποστολή..." : "Υποβολή αναφοράς"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
