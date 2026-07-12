"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Link2, Trash2, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  removeListingExternalLink,
  saveListingExternalLink,
} from "@/lib/actions";
import {
  EXTERNAL_LINK_PLATFORM_LABELS,
  EXTERNAL_LINK_PLATFORMS,
  validateExternalLinkUrl,
  type ExternalLinkPlatform,
  type ListingExternalLink,
} from "@/lib/listing-external-links";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initialLinks: ListingExternalLink[];
};

type RowState = {
  url: string;
  isPublic: boolean;
  label: string;
};

function rowFromLinks(links: ListingExternalLink[]): Record<ExternalLinkPlatform, RowState> {
  const base: Record<ExternalLinkPlatform, RowState> = {
    airbnb: { url: "", isPublic: false, label: "" },
    booking: { url: "", isPublic: false, label: "" },
    vrbo: { url: "", isPublic: false, label: "" },
    other: { url: "", isPublic: false, label: "" },
  };
  for (const link of links) {
    base[link.platform] = {
      url: link.url,
      isPublic: link.is_public,
      label: link.label ?? "",
    };
  }
  return base;
}

export function ListingExternalLinksEditor({ listingId, initialLinks }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(() => rowFromLinks(initialLinks));
  const [pending, startTransition] = useTransition();
  const [activePlatform, setActivePlatform] = useState<ExternalLinkPlatform | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const savedPlatforms = useMemo(
    () => new Set(initialLinks.map((l) => l.platform)),
    [initialLinks]
  );

  function updateRow(platform: ExternalLinkPlatform, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }));
  }

  function handleSave(platform: ExternalLinkPlatform) {
    const row = rows[platform];
    const validation = validateExternalLinkUrl(platform, row.url);
    if (!validation.valid) {
      setError(validation.error ?? "Μη έγκυρο URL.");
      return;
    }

    setError(null);
    setFeedback(null);
    setActivePlatform(platform);
    startTransition(async () => {
      const result = await saveListingExternalLink(
        listingId,
        platform,
        row.url,
        row.isPublic,
        platform === "other" ? row.label : null
      );
      setActivePlatform(null);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setFeedback(
        result && "warning" in result && result.warning
          ? `Αποθηκεύτηκε. ${result.warning}`
          : "Αποθηκεύτηκε."
      );
      router.refresh();
    });
  }

  function handleRemove(platform: ExternalLinkPlatform) {
    setError(null);
    setActivePlatform(platform);
    startTransition(async () => {
      const result = await removeListingExternalLink(listingId, platform);
      setActivePlatform(null);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      updateRow(platform, { url: "", isPublic: false, label: "" });
      setFeedback("Ο σύνδεσμος αφαιρέθηκε.");
      router.refresh();
    });
  }

  return (
    <GlassCard className="mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-charcoal">
            Σύνδεσμοι σε άλλες πλατφόρμες
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Πρόσθεσε προαιρετικά σύνδεσμο από άλλη πλατφόρμα όπου υπάρχει το ακίνητο. Το Midora
            δεν εισάγει αυτόματα περιεχόμενο από άλλες πλατφόρμες.
          </p>
        </div>
        <Link2 className="h-5 w-5 shrink-0 text-gold/60" aria-hidden />
      </div>

      <p className="mt-3 rounded-lg border border-border/80 bg-sand/20 px-3 py-2 text-xs text-muted">
        Οι σύνδεσμοι σε άλλες πλατφόρμες μπορούν να βοηθήσουν τον ενδιαφερόμενο να διασταυρώσει
        ότι το ακίνητο υπάρχει και αλλού. Εμφανίζονται δημόσια μόνο αν το επιλέξεις.
      </p>

      {feedback && (
        <p className="mt-3 rounded-lg border border-teal/25 bg-teal/5 px-3 py-2 text-sm text-teal">
          {feedback}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-4">
        {EXTERNAL_LINK_PLATFORMS.map((platform) => {
          const row = rows[platform];
          const validation = row.url.trim()
            ? validateExternalLinkUrl(platform, row.url)
            : null;
          const isSaved = savedPlatforms.has(platform);
          const busy = pending && activePlatform === platform;

          return (
            <div
              key={platform}
              className="rounded-xl border border-border bg-white p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-charcoal">
                  {EXTERNAL_LINK_PLATFORM_LABELS[platform]} URL
                </p>
                {validation && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      validation.valid
                        ? "bg-teal/10 text-teal"
                        : "bg-red-50 text-red-600"
                    )}
                  >
                    {validation.valid ? (
                      <>
                        <Check className="h-3 w-3" />
                        Έγκυρο
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Μη έγκυρο
                      </>
                    )}
                  </span>
                )}
              </div>

              <input
                type="url"
                inputMode="url"
                placeholder="https://"
                value={row.url}
                onChange={(e) => updateRow(platform, { url: e.target.value })}
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/40"
              />

              {validation?.error && (
                <p className="mt-1 text-xs text-red-600">{validation.error}</p>
              )}
              {validation?.warning && validation.valid && (
                <p className="mt-1 text-xs text-amber-800">{validation.warning}</p>
              )}

              {platform === "other" && (
                <input
                  type="text"
                  placeholder="Ετικέτα πλατφόρμας (προαιρετικά)"
                  value={row.label}
                  onChange={(e) => updateRow(platform, { label: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/40"
                />
              )}

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={row.isPublic}
                  onChange={(e) => updateRow(platform, { isPublic: e.target.checked })}
                  className="h-4 w-4 accent-charcoal"
                />
                Εμφάνιση στη δημόσια αγγελία
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !row.url.trim()}
                  onClick={() => handleSave(platform)}
                  className="inline-flex min-h-8 items-center rounded-lg bg-charcoal px-3 text-xs font-semibold text-white hover:bg-charcoal/90 disabled:opacity-40"
                >
                  {busy ? "Αποθήκευση…" : "Αποθήκευση"}
                </button>
                {validation?.valid && validation.normalizedUrl && (
                  <a
                    href={validation.normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:bg-sand"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Άνοιγμα
                  </a>
                )}
                {(isSaved || row.url.trim()) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRemove(platform)}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Αφαίρεση
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
