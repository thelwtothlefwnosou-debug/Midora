"use client";

import { useState, useTransition } from "react";
import { Bell, BookmarkPlus, Check } from "lucide-react";
import { saveSearch } from "@/lib/actions";
import { buildSavedSearchName } from "@/lib/saved-searches";
import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";
import { cn } from "@/lib/utils";

type Props = {
  filters: ListingsFilterValues;
  className?: string;
  compact?: boolean;
};

function filtersToRecord(filters: ListingsFilterValues): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim() && value !== "newest") out[key] = value.trim();
  }
  return out;
}

export function SaveSearchButton({ filters, className, compact = false }: Props) {
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filterRecord = filtersToRecord(filters);
  const hasFilters = Object.keys(filterRecord).length > 0;

  function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!hasFilters) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("filters", JSON.stringify(filterRecord));
      if (name.trim()) fd.set("name", name.trim());
      fd.set("email_alerts", emailAlerts ? "true" : "false");

      const result = await saveSearch(fd);
      if (result?.error) {
        if (result.error === "Πρέπει να συνδεθείς") {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        setError(result.error);
        return;
      }
      setSaved(true);
      setShowForm(false);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  if (!hasFilters) return null;

  return (
    <div className={cn("relative shrink-0", className)}>
      {showForm ? (
        <form
          onSubmit={handleSave}
          className="flex max-w-md flex-col gap-2 rounded-xl border border-border bg-white px-3 py-3 sm:min-w-[320px]"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={buildSavedSearchName(filterRecord)}
            className="w-full rounded-lg border border-border bg-sand/30 px-3 py-2 text-sm text-charcoal outline-none placeholder:text-muted/80 focus:border-gold/40"
            autoFocus
          />
          <label className="flex cursor-pointer items-start gap-2 text-xs text-charcoal/80">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="mt-0.5 rounded border-border text-gold focus:ring-gold/40"
            />
            <span>
              <span className="flex items-center gap-1 font-medium text-charcoal">
                <Bell className="h-3.5 w-3.5 text-gold" />
                Ειδοποίησέ με με email
              </span>
              Θα λάβεις email όταν εγκριθεί νέο ακίνητο που ταιριάζει.
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Αποθήκευση
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-muted hover:text-charcoal"
            >
              Άκυρο
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={pending || saved}
          title="Αποθήκευση & ειδοποίηση"
          className={cn(
            "flex shrink-0 items-center justify-center transition-colors",
            compact
              ? "h-10 w-10 rounded-full border border-border bg-white text-charcoal hover:border-gold/30 hover:text-gold-dark"
              : "gap-2 rounded-xl border px-3 py-2.5 text-sm",
            !compact &&
              (saved
                ? "border-teal/40 bg-teal/10 text-teal"
                : "border-border bg-sand/50 text-charcoal/70 hover:border-gold/30 hover:text-gold"),
            compact && saved && "border-teal/40 text-teal"
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              {!compact && "Αποθηκεύτηκε"}
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" />
              {!compact && (
                <>
                  <span className="hidden sm:inline">Αποθήκευση &amp; ειδοποίηση</span>
                  <span className="sm:hidden">Αποθήκευση</span>
                </>
              )}
            </>
          )}
        </button>
      )}
      {error && <p className="absolute top-full mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
