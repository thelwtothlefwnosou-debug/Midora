"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  removeListingExternalLink,
  saveListingExternalLink,
} from "@/lib/actions";
import {
  EXTERNAL_LINK_PLATFORM_LABELS,
  EXTERNAL_LINK_PLATFORMS,
  isStoredExternalLinkValid,
  validateExternalLinkUrl,
  type ExternalLinkPlatform,
  type ListingExternalLink,
} from "@/lib/listing-external-links";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initialLinks: ListingExternalLink[];
};

type ModalMode = "add" | "edit" | null;

type FormState = {
  platform: ExternalLinkPlatform;
  url: string;
  label: string;
  isPublic: boolean;
};

const EMPTY_FORM: FormState = {
  platform: "airbnb",
  url: "",
  label: "",
  isPublic: false,
};

function formFromLink(link: ListingExternalLink): FormState {
  return {
    platform: link.platform,
    url: link.url,
    label: link.label ?? "",
    isPublic: link.is_public,
  };
}

function truncateUrl(url: string, max = 52): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

function ExternalLinkModal({
  mode,
  listingId,
  initialLinks,
  editingLink,
  pending,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  listingId: string;
  initialLinks: ListingExternalLink[];
  editingLink: ListingExternalLink | null;
  pending: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const usedPlatforms = useMemo(
    () => new Set(initialLinks.map((l) => l.platform)),
    [initialLinks]
  );

  const availablePlatforms = useMemo(() => {
    if (mode === "edit" && editingLink) {
      return EXTERNAL_LINK_PLATFORMS;
    }
    return EXTERNAL_LINK_PLATFORMS.filter((p) => !usedPlatforms.has(p));
  }, [editingLink, mode, usedPlatforms]);

  const [form, setForm] = useState<FormState>(() =>
    mode === "edit" && editingLink ? formFromLink(editingLink) : { ...EMPTY_FORM, platform: availablePlatforms[0] ?? "airbnb" }
  );
  const [error, setError] = useState<string | null>(null);
  const [localPending, startTransition] = useTransition();

  const validation = form.url.trim()
    ? validateExternalLinkUrl(form.platform, form.url)
    : null;

  const busy = pending || localPending;

  function handleSave() {
    const result = validateExternalLinkUrl(form.platform, form.url);
    if (!result.valid || !result.normalizedUrl) {
      setError(result.error ?? "Μη έγκυρο URL.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const saveResult = await saveListingExternalLink(
        listingId,
        form.platform,
        result.normalizedUrl!,
        form.isPublic,
        form.platform === "other" ? form.label : null
      );
      if (saveResult && "error" in saveResult && saveResult.error) {
        setError(saveResult.error);
        return;
      }
      onSaved();
      onClose();
    });
  }

  function handleRemove() {
    if (!editingLink) return;
    if (
      !window.confirm("Θέλεις σίγουρα να αφαιρέσεις αυτόν τον σύνδεσμο;")
    ) {
      return;
    }

    startTransition(async () => {
      const result = await removeListingExternalLink(listingId, editingLink.platform);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      onSaved();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-link-modal-title"
      >
        <h3
          id="external-link-modal-title"
          className="font-display text-lg font-semibold text-charcoal"
        >
          {mode === "add" ? "Προσθήκη εξωτερικού συνδέσμου" : "Επεξεργασία συνδέσμου"}
        </h3>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase text-muted">Πλατφόρμα</span>
            <select
              value={form.platform}
              disabled={mode === "edit"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  platform: e.target.value as ExternalLinkPlatform,
                }))
              }
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/40 disabled:bg-sand/30"
            >
              {(mode === "edit" ? EXTERNAL_LINK_PLATFORMS : availablePlatforms).map((p) => (
                <option key={p} value={p}>
                  {EXTERNAL_LINK_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase text-muted">Σύνδεσμος αγγελίας</span>
            <input
              type="url"
              inputMode="url"
              placeholder="Επικόλλησε εδώ το link της αγγελίας"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/40"
            />
          </label>

          {validation?.valid && (
            <p className="text-xs text-teal">Ο σύνδεσμος είναι έγκυρος.</p>
          )}
          {validation?.error && (
            <p className="text-xs text-red-600">{validation.error}</p>
          )}
          {validation?.warning && validation.valid && (
            <p className="text-xs text-amber-800">{validation.warning}</p>
          )}

          {form.platform === "other" && (
            <label className="block">
              <span className="text-xs font-medium uppercase text-muted">Όνομα πλατφόρμας</span>
              <input
                type="text"
                placeholder="Όνομα πλατφόρμας"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/40"
              />
            </label>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-sand/15 px-3 py-3">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-charcoal"
            />
            <span className="text-sm text-charcoal">
              <span className="font-medium">Εμφάνιση στη δημόσια αγγελία</span>
              <span className="mt-1 block text-xs text-muted">
                Αν το ενεργοποιήσεις, ο σύνδεσμος θα εμφανίζεται χαμηλά στη δημόσια σελίδα της
                αγγελίας.
              </span>
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Αφαίρεση συνδέσμου
            </button>
          ) : (
            <span />
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-charcoal hover:bg-sand"
            >
              Ακύρωση
            </button>
            <button
              type="button"
              disabled={busy || !form.url.trim() || !validation?.valid}
              onClick={handleSave}
              className="rounded-xl bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:bg-charcoal/90 disabled:opacity-40"
            >
              {busy
                ? "Αποθήκευση…"
                : mode === "add"
                  ? "Αποθήκευση συνδέσμου"
                  : "Αποθήκευση αλλαγών"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListingExternalLinksEditor({ listingId, initialLinks }: Props) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingLink, setEditingLink] = useState<ListingExternalLink | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const savedLinks = initialLinks;
  const canAddMore = savedLinks.length < EXTERNAL_LINK_PLATFORMS.length;

  function openAdd() {
    setEditingLink(null);
    setModalMode("add");
  }

  function openEdit(link: ListingExternalLink) {
    setEditingLink(link);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingLink(null);
  }

  function handleSaved() {
    setFeedback("Ο σύνδεσμος αποθηκεύτηκε.");
    startTransition(() => router.refresh());
  }

  return (
    <GlassCard id="external-links" className="mt-6 scroll-mt-24 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-charcoal">
            Σύνδεσμοι σε άλλες πλατφόρμες
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Πρόσθεσε προαιρετικά σύνδεσμο από άλλη πλατφόρμα όπου υπάρχει το ίδιο ακίνητο.
          </p>
        </div>
        <Link2 className="h-5 w-5 shrink-0 text-gold/60" aria-hidden />
      </div>

      <p className="mt-3 rounded-lg border border-border/80 bg-sand/20 px-3 py-2 text-xs text-muted">
        Οι σύνδεσμοι μπορούν να βοηθήσουν τον επισκέπτη να διασταυρώσει ότι το ακίνητο υπάρχει και
        αλλού. Το Midora δεν εισάγει αυτόματα περιεχόμενο από άλλες πλατφόρμες.
      </p>

      {feedback && (
        <p className="mt-3 rounded-lg border border-teal/25 bg-teal/5 px-3 py-2 text-sm text-teal">
          {feedback}
        </p>
      )}

      {savedLinks.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-sand/10 px-4 py-8 text-center">
          <p className="text-sm text-muted">
            Δεν έχεις προσθέσει ακόμα σύνδεσμο από άλλη πλατφόρμα.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90"
          >
            <Plus className="h-4 w-4" />
            Προσθήκη συνδέσμου
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {savedLinks.map((link) => {
            const valid = isStoredExternalLinkValid(link);
            const platformLabel =
              link.platform === "other" && link.label
                ? link.label
                : EXTERNAL_LINK_PLATFORM_LABELS[link.platform];

            return (
              <div
                key={link.id}
                className="rounded-xl border border-border bg-white p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-charcoal">{platformLabel}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          valid ? "bg-teal/10 text-teal" : "bg-red-50 text-red-600"
                        )}
                      >
                        {valid ? (
                          <>
                            <Check className="h-3 w-3" />
                            Έγκυρος σύνδεσμος
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" />
                            Μη έγκυρος σύνδεσμος
                          </>
                        )}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          link.is_public
                            ? "bg-gold/10 text-gold-dark"
                            : "bg-sand text-muted"
                        )}
                      >
                        Δημόσια εμφάνιση: {link.is_public ? "Ενεργή" : "Ανενεργή"}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted">
                      {truncateUrl(link.url)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {valid && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:bg-sand"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Άνοιγμα
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:bg-sand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Επεξεργασία
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {canAddMore && (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-charcoal hover:border-gold/30 hover:bg-sand/30"
            >
              <Plus className="h-4 w-4" />
              Προσθήκη συνδέσμου
            </button>
          )}
        </div>
      )}

      {modalMode && (
        <ExternalLinkModal
          mode={modalMode}
          listingId={listingId}
          initialLinks={savedLinks}
          editingLink={editingLink}
          pending={pending}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </GlassCard>
  );
}
