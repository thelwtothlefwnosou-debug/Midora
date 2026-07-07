"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { submitPropertyLead } from "@/lib/actions";
import { getListingPublicId } from "@/lib/utils";
import type { ListingWithImages } from "@/lib/types";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { InterestPrefill } from "@/components/listings/ListingInterestContext";
import {
  formatInterestRangeLabel,
  formatMonthLabel,
} from "@/lib/search-interest-dates";

const DEFAULT_MESSAGE =
  "Γεια σας, ενδιαφέρομαι για αυτή την αγγελία και θα ήθελα περισσότερες πληροφορίες.";

type DefaultContact = {
  name?: string;
  email?: string;
  phone?: string;
};

type Props = {
  listing: ListingWithImages;
  open: boolean;
  onClose: () => void;
  sessionKey: number;
  defaultContact?: DefaultContact;
  prefill?: InterestPrefill;
};

function resolveModalTitle(prefill?: InterestPrefill, success?: boolean): string {
  if (success) return COPY.interestSuccessTitle;
  if (prefill?.interestStartMonth) return "Αίτημα μίσθωσης";
  if (prefill?.interestStartDate) return "Αίτημα διαθεσιμότητας";
  return "Επικοινωνία με τον ιδιοκτήτη";
}

function InquirySummary({ prefill }: { prefill?: InterestPrefill }) {
  if (!prefill) return null;

  const rows: { label: string; value: string }[] = [];

  if (prefill.interestStartDate && prefill.interestEndDate) {
    rows.push({
      label: "Ημερομηνίες",
      value: formatInterestRangeLabel(prefill.interestStartDate, prefill.interestEndDate),
    });
  } else if (prefill.interestStartMonth) {
    rows.push({
      label: "Μήνας έναρξης",
      value: formatMonthLabel(prefill.interestStartMonth),
    });
  }

  if (prefill.interestDurationMonths != null) {
    rows.push({
      label: "Διάρκεια",
      value: `${prefill.interestDurationMonths} ${
        prefill.interestDurationMonths === 1 ? "μήνας" : "μήνες"
      }`,
    });
  } else if (prefill.duration?.trim()) {
    rows.push({ label: "Διάρκεια", value: prefill.duration.trim() });
  }

  if (prefill.guests != null) {
    rows.push({
      label: "Άτομα",
      value: `${prefill.guests} ${prefill.guests === 1 ? "άτομο" : "άτομα"}`,
    });
  }

  if (!rows.length) return null;

  return (
    <div className="rounded-xl border border-charcoal/10 bg-sand/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Επιλογές σου</p>
      <dl className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 text-sm">
            <dt className="text-muted">{row.label}</dt>
            <dd className="font-medium text-charcoal">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PropertyContactModalContent({
  listing,
  onClose,
  defaultContact,
  prefill,
}: {
  listing: ListingWithImages;
  onClose: () => void;
  defaultContact?: DefaultContact;
  prefill?: InterestPrefill;
}) {
  const hasStructuredDates = Boolean(
    prefill?.interestStartDate ||
      prefill?.interestStartMonth ||
      prefill?.timingNote?.trim()
  );
  const hasStructuredDuration = Boolean(
    prefill?.interestDurationMonths != null || prefill?.duration?.trim()
  );

  const [name, setName] = useState(defaultContact?.name ?? "");
  const [email, setEmail] = useState(defaultContact?.email ?? "");
  const [phone, setPhone] = useState(defaultContact?.phone ?? "");
  const [timingNote, setTimingNote] = useState(prefill?.timingNote ?? "");
  const [duration, setDuration] = useState(prefill?.duration ?? "");
  const [message, setMessage] = useState(prefill?.message ?? DEFAULT_MESSAGE);
  const [preferredReply, setPreferredReply] = useState<"phone" | "email" | "message">("phone");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const listingHref = `/listings/${getListingPublicId(listing)}`;
  const modalTitle = resolveModalTitle(prefill, success);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Συμπλήρωσε το όνομά σου.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Συμπλήρωσε email ή τηλέφωνο επικοινωνίας.");
      return;
    }

    const fd = new FormData();
    fd.set("listing_id", listing.id);
    fd.set("name", name.trim());
    if (email.trim()) fd.set("email", email.trim());
    if (phone.trim()) fd.set("phone", phone.trim());
    if (timingNote.trim()) fd.set("timing_note", timingNote.trim());
    if (duration.trim()) fd.set("duration", duration.trim());
    const replyLabels = {
      phone: "κινητό",
      email: "email",
      message: "μήνυμα Midora",
    } as const;
    const body = message.trim();
    const withPreference = `[Προτιμώ επικοινωνία: ${replyLabels[preferredReply]}]\n\n${body || DEFAULT_MESSAGE}`;
    fd.set("message", withPreference);
    if (prefill?.interestStartDate) fd.set("interest_start_date", prefill.interestStartDate);
    if (prefill?.interestEndDate) fd.set("interest_end_date", prefill.interestEndDate);
    if (prefill?.interestStartMonth) fd.set("interest_start_month", prefill.interestStartMonth);
    if (prefill?.interestDurationMonths != null) {
      fd.set("interest_duration_months", String(prefill.interestDurationMonths));
    }
    if (prefill?.guests != null) fd.set("guests", String(prefill.guests));

    startTransition(async () => {
      const result = await submitPropertyLead(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 id="property-contact-modal-title" className="font-display text-lg font-semibold text-charcoal">
            {modalTitle}
          </h2>
          {!success && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">{listing.title}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-charcoal/5"
          aria-label="Κλείσιμο"
        >
          <X className="h-5 w-5 text-muted" />
        </button>
      </div>

      {success ? (
        <div className="overflow-y-auto px-5 py-6">
          <p className="text-sm leading-relaxed text-charcoal/75">{COPY.interestSuccessText}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/listings"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
            >
              Συνέχισε την αναζήτηση
            </Link>
            <Link
              href={listingHref}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-charcoal hover:border-gold/30"
            >
              Δες την αγγελία
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="overflow-y-auto overscroll-contain px-5 py-5">
          <div className="space-y-4">
            <InquirySummary prefill={prefill} />

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Όνομα *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Κινητό</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="69xxxxxxxx"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
                />
              </label>
            </div>
            <p className="text-xs text-muted">* Απαιτείται email ή κινητό</p>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Προτιμώ να με επικοινωνήσουν με
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { id: "phone", label: "Κινητό" },
                    { id: "email", label: "Email" },
                    { id: "message", label: "Μήνυμα" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPreferredReply(option.id)}
                    className={cn(
                      "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                      preferredReply === option.id
                        ? "border-gold bg-gold/10 text-charcoal"
                        : "border-border bg-white text-charcoal/70 hover:border-gold/30"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {!hasStructuredDates && (
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Πότε περίπου ενδιαφέρεσαι;
                </span>
                <input
                  value={timingNote}
                  onChange={(e) => setTimingNote(e.target.value)}
                  placeholder="π.χ. Σεπτέμβριος 2026"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/50 focus:border-gold/50"
                />
              </label>
            )}

            {!hasStructuredDuration && (
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Εκτιμώμενη διάρκεια
                </span>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="π.χ. 2–3 μήνες"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/50 focus:border-gold/50"
                />
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Μήνυμα</span>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={DEFAULT_MESSAGE}
                className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
              />
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Με την αποστολή αιτήματος αποδέχεσαι τους{" "}
            <Link href="/terms" className="text-gold hover:underline">
              Όρους χρήσης
            </Link>{" "}
            και την{" "}
            <Link href="/privacy" className="text-gold hover:underline">
              Πολιτική απορρήτου
            </Link>
            . Το Midora διαβιβάζει το μήνυμά σου στον ιδιοκτήτη για σκοπούς αρχικής επικοινωνίας.
          </p>

          <div className="mt-6 flex gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-xl border border-border text-sm font-medium text-charcoal hover:bg-charcoal/5"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "min-h-11 flex-1 rounded-xl bg-gold text-sm font-semibold text-white hover:bg-gold-dark",
                pending && "opacity-60"
              )}
            >
              {pending ? "Αποστολή..." : COPY.submitInterest}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export function PropertyContactModal({
  listing,
  open,
  onClose,
  sessionKey,
  defaultContact,
  prefill,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-contact-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/45"
        aria-label="Κλείσιμο"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <PropertyContactModalContent
          key={sessionKey}
          listing={listing}
          onClose={onClose}
          defaultContact={defaultContact}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
