"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { submitBugReport } from "@/lib/admin/actions";

const CATEGORIES = [
  { value: "search", label: "Αναζήτηση" },
  { value: "listing", label: "Αγγελία" },
  { value: "dashboard", label: "Dashboard" },
  { value: "calendar", label: "Ημερολόγιο" },
  { value: "photos", label: "Φωτογραφίες" },
  { value: "contact", label: "Επικοινωνία" },
  { value: "verification", label: "Επαλήθευση" },
  { value: "account", label: "Λογαριασμός" },
  { value: "other", label: "Άλλο" },
] as const;

function collectBrowserInfo() {
  if (typeof window === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    language: navigator.language,
  };
}

const INITIAL = {
  category: "other",
  message: "",
  error: null as string | null,
  success: false,
};

export function BugReportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(INITIAL.category);
  const [message, setMessage] = useState(INITIAL.message);
  const [error, setError] = useState<string | null>(INITIAL.error);
  const [success, setSuccess] = useState(INITIAL.success);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function close() {
    setCategory(INITIAL.category);
    setMessage(INITIAL.message);
    setError(INITIAL.error);
    setSuccess(INITIAL.success);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("category", category);
    fd.set("message", message);
    fd.set("page_url", window.location.href);
    fd.set("browser_info", JSON.stringify(collectBrowserInfo()));

    startTransition(async () => {
      const result = await submitBugReport(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/40"
        onClick={close}
        aria-label="Κλείσιμο"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal">Αναφορά προβλήματος</h2>
          <button type="button" onClick={close} className="rounded-lg p-1 hover:bg-sand">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <p className="text-sm text-teal">
            Η αναφορά σου στάλθηκε. Θα την εξετάσουμε το συντομότερο.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-charcoal">Κατηγορία</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-charcoal">Περιγραφή προβλήματος</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                minLength={10}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Περιέγραψε τι συνέβη…"
              />
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-charcoal py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Αποστολή αναφοράς
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function BugReportButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? "Αναφορά προβλήματος"}
      </button>
      <BugReportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
