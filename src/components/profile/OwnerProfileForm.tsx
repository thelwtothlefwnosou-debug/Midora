"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { Profile } from "@/lib/types";
import {
  COMMUNICATION_LANGUAGE_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  PROFILE_BIO_MAX,
} from "@/lib/profile-display";
import {
  updateOwnerProfilePage,
  type ProfilePageSaveState,
} from "@/lib/profile-page-actions";
import { publicProfilePath } from "@/lib/profile-public-url";
import { normalizePublicProfileSlug } from "@/lib/profile-slug";
import { ProfilePreviewCard } from "@/components/profile/ProfilePreviewCard";
import { useUnsavedChangesPrompt } from "@/hooks/useUnsavedChangesPrompt";
import { cn } from "@/lib/utils";

type Props = {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  showPublicPhoto?: boolean;
};

type SaveUiState = "idle" | "saving" | "saved" | "error";

function fieldClassName() {
  return "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/15";
}

export function OwnerProfileForm({
  profile,
  email,
  avatarUrl,
  phoneVerified = false,
  emailVerified = false,
  showPublicPhoto,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [saveUi, setSaveUi] = useState<SaveUiState>("idle");
  const [advertiserType, setAdvertiserType] = useState(
    profile.advertiser_type ?? "individual"
  );
  const [displayName, setDisplayName] = useState(
    profile.display_name ?? profile.full_name ?? ""
  );
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [languages, setLanguages] = useState<string[]>(
    profile.communication_languages ?? []
  );
  const [businessName, setBusinessName] = useState(profile.business_name ?? "");
  const [businessTitle, setBusinessTitle] = useState(profile.business_title ?? "");
  const [publicSlug, setPublicSlug] = useState(profile.public_slug ?? "");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(
    profile.public_profile_enabled !== false
  );
  const [showOwnedListings, setShowOwnedListings] = useState(
    profile.show_owned_listings_on_profile !== false
  );
  const [showCohostedListings, setShowCohostedListings] = useState(
    profile.show_cohosted_listings_on_profile !== false
  );

  const [state, formAction, pending] = useActionState<
    ProfilePageSaveState | null,
    FormData
  >(updateOwnerProfilePage, null);

  useUnsavedChangesPrompt(dirty);

  useEffect(() => {
    if (pending) setSaveUi("saving");
  }, [pending]);

  useEffect(() => {
    if (state?.success) {
      setDirty(false);
      setSaveUi("saved");
    } else if (state?.error) {
      setSaveUi("error");
    }
  }, [state?.success, state?.error]);

  function toggleLanguage(code: string) {
    setDirty(true);
    setSaveUi("idle");
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function markDirty() {
    setDirty(true);
    if (saveUi === "saved") setSaveUi("idle");
  }

  const stickyMessage = (() => {
    if (saveUi === "saving") return "Αποθήκευση…";
    if (saveUi === "saved" && !dirty) return "Οι αλλαγές αποθηκεύτηκαν";
    if (saveUi === "error") return "Δεν ήταν δυνατή η αποθήκευση";
    if (dirty) return "Έχεις μη αποθηκευμένες αλλαγές";
    return "";
  })();

  const previewPublicHref = publicProfilePath({
    id: profile.id,
    public_slug: publicSlug.trim() || profile.public_slug,
    public_profile_enabled: publicProfileEnabled,
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={markDirty}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-border bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-charcoal">Δημόσιο προφίλ</h2>
        <p className="mt-1 text-sm text-muted">
          Αυτά τα στοιχεία μπορεί να εμφανίζονται στους ενδιαφερόμενους.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="display_name" className="text-xs font-medium text-muted uppercase">
              Εμφανιζόμενο όνομα
            </label>
            <input
              id="display_name"
              name="display_name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                markDirty();
              }}
              placeholder={profile.full_name ?? "Όνομα που θα βλέπουν οι επισκέπτες"}
              className={fieldClassName()}
            />
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-muted uppercase">
              Τύπος αγγελιοδότη
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(
                [
                  { value: "individual", label: "Ιδιώτης" },
                  { value: "professional", label: "Επαγγελματίας" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
                    advertiserType === opt.value
                      ? "border-gold bg-gold/5 text-charcoal"
                      : "border-border text-muted hover:border-gold/30"
                  )}
                >
                  <input
                    type="radio"
                    name="advertiser_type"
                    value={opt.value}
                    checked={advertiserType === opt.value}
                    onChange={() => {
                      setAdvertiserType(opt.value);
                      markDirty();
                    }}
                    className="accent-gold"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="bio" className="text-xs font-medium text-muted uppercase">
              Σύντομη περιγραφή
              <span className="ml-1 font-normal normal-case text-muted/80">(προαιρετικό)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={PROFILE_BIO_MAX}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                markDirty();
              }}
              placeholder="Γράψε λίγα λόγια για εσένα ή για τον τρόπο με τον οποίο διαχειρίζεσαι τα ακίνητά σου."
              className={cn(fieldClassName(), "min-h-[100px] resize-y")}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {bio.length}/{PROFILE_BIO_MAX}
            </p>
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-muted uppercase">
              Γλώσσες επικοινωνίας
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMUNICATION_LANGUAGE_OPTIONS.map((lang) => (
                <label
                  key={lang.value}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                    languages.includes(lang.value)
                      ? "border-gold bg-gold/10 text-charcoal"
                      : "border-border text-muted hover:border-gold/30"
                  )}
                >
                  <input
                    type="checkbox"
                    name="communication_languages"
                    value={lang.value}
                    checked={languages.includes(lang.value)}
                    onChange={() => toggleLanguage(lang.value)}
                    className="sr-only"
                  />
                  {lang.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="public_slug" className="text-xs font-medium text-muted uppercase">
              Δημόσιο URL προφίλ
              <span className="ml-1 font-normal normal-case text-muted/80">(προαιρετικό)</span>
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="shrink-0 text-sm text-muted">/users/</span>
              <input
                id="public_slug"
                name="public_slug"
                value={publicSlug}
                onChange={(e) => {
                  setPublicSlug(e.target.value);
                  markDirty();
                }}
                onBlur={() => {
                  const normalized = normalizePublicProfileSlug(publicSlug);
                  if (normalized !== publicSlug) setPublicSlug(normalized);
                }}
                placeholder="maria-host"
                className={fieldClassName()}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Αν το αφήσεις κενό, δημιουργείται αυτόματα από το εμφανιζόμενο όνομα.
            </p>
            {previewPublicHref && publicProfileEnabled ? (
              <Link
                href={previewPublicHref}
                target="_blank"
                className="mt-2 inline-block text-sm font-medium text-gold hover:underline"
              >
                Προεπισκόπηση δημόσιου προφίλ
              </Link>
            ) : null}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-muted uppercase">Ρυθμίσεις ορατότητας</legend>
            <input
              type="hidden"
              name="public_profile_enabled"
              value={publicProfileEnabled ? "true" : "false"}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={publicProfileEnabled}
                onChange={(e) => {
                  setPublicProfileEnabled(e.target.checked);
                  markDirty();
                }}
                className="mt-0.5 accent-gold"
              />
              <span>
                <span className="block text-sm font-medium text-charcoal">
                  Επιτρέπεται στους επισκέπτες να ανοίγουν το δημόσιο προφίλ μου
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Εμφανίζεται όταν έχεις δημοσιευμένες αγγελίες.
                </span>
              </span>
            </label>

            <input
              type="hidden"
              name="show_owned_listings_on_profile"
              value={showOwnedListings ? "true" : "false"}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={showOwnedListings}
                onChange={(e) => {
                  setShowOwnedListings(e.target.checked);
                  markDirty();
                }}
                className="mt-0.5 accent-gold"
              />
              <span className="text-sm text-charcoal">Εμφάνιση δημοσιευμένων αγγελιών στο προφίλ</span>
            </label>

            <input
              type="hidden"
              name="show_cohosted_listings_on_profile"
              value={showCohostedListings ? "true" : "false"}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={showCohostedListings}
                onChange={(e) => {
                  setShowCohostedListings(e.target.checked);
                  markDirty();
                }}
                className="mt-0.5 accent-gold"
              />
              <span className="text-sm text-charcoal">
                Εμφάνιση ακινήτων που συνδιαχειρίζομαι ως συνοικοδεσπότης
              </span>
            </label>
          </fieldset>
        </div>
      </section>

      <ProfilePreviewCard
        profile={profile}
        avatarUrl={avatarUrl}
        phoneVerified={phoneVerified}
        displayNameOverride={displayName}
        bioOverride={bio}
        advertiserTypeOverride={advertiserType}
        languagesOverride={languages}
        businessTitleOverride={businessTitle}
        showPublicPhoto={showPublicPhoto}
      />

      <section className="rounded-2xl border border-border bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Στοιχεία επικοινωνίας
        </h2>
        <p className="mt-1 text-sm text-muted">
          Χρησιμοποιούνται για τη διαχείριση του λογαριασμού σου.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="full_name" className="text-xs font-medium text-muted uppercase">
              {advertiserType === "professional" ? "Ονοματεπώνυμο υπεύθυνου" : "Ονοματεπώνυμο"}
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                markDirty();
              }}
              className={fieldClassName()}
            />
          </div>

          {advertiserType === "professional" && (
            <>
              <div>
                <label htmlFor="business_name" className="text-xs font-medium text-muted uppercase">
                  Επωνυμία επιχείρησης
                </label>
                <input
                  id="business_name"
                  name="business_name"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    markDirty();
                  }}
                  className={fieldClassName()}
                />
              </div>
              <div>
                <label htmlFor="business_title" className="text-xs font-medium text-muted uppercase">
                  Επαγγελματικός τίτλος
                </label>
                <input
                  id="business_title"
                  name="business_title"
                  value={businessTitle}
                  onChange={(e) => {
                    setBusinessTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder="π.χ. Διαχειριστής ακινήτων"
                  className={fieldClassName()}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted uppercase">Email</label>
            <input value={email} readOnly className={cn(fieldClassName(), "bg-sand/40 text-muted")} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase">Τηλέφωνο</label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                value={profile.phone || "—"}
                readOnly
                className={cn(fieldClassName(), "flex-1 bg-sand/40 text-muted")}
              />
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                  <BadgeCheck className="h-3 w-3" />
                  Επιβεβαιωμένο
                </span>
              )}
            </div>
            <Link
              href="/dashboard/settings/contact"
              className="mt-2 inline-block text-sm font-medium text-gold hover:underline"
            >
              Διαχείριση τηλεφώνου και SMS
            </Link>
          </div>

          <div>
            <label htmlFor="preferred_contact_method" className="text-xs font-medium text-muted uppercase">
              Προτιμώμενος τρόπος επικοινωνίας
            </label>
            <select
              id="preferred_contact_method"
              name="preferred_contact_method"
              defaultValue={profile.preferred_contact_method ?? "message"}
              className={fieldClassName()}
            >
              {PREFERRED_CONTACT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-border bg-sand/30 px-4 py-3 text-sm text-muted">
          Το email και το τηλέφωνό σου δεν εμφανίζονται δημόσια στις αγγελίες. Η επικοινωνία
          ξεκινά μέσω αιτήματος ή μηνύματος Midora.
        </p>
      </section>

      {saveUi === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p className="font-medium">Δεν ήταν δυνατή η αποθήκευση</p>
          {state?.error && <p className="mt-1 text-red-500/90">{state.error}</p>}
          <button type="submit" className="mt-2 font-medium text-red-700 underline">
            Δοκίμασε ξανά
          </button>
        </div>
      )}

      {saveUi === "saved" && !dirty && (
        <p className="text-sm text-teal">Οι αλλαγές αποθηκεύτηκαν</p>
      )}

      <div
        className={cn(
          "sticky bottom-0 z-30 -mx-1 border-t border-border bg-white/95 px-1 py-4 backdrop-blur-md",
          "supports-[backdrop-filter]:bg-white/80"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {stickyMessage ? (
            <p
              className={cn(
                "text-xs",
                saveUi === "error" ? "text-red-600" : saveUi === "saved" ? "text-teal" : "text-muted"
              )}
            >
              {stickyMessage}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-xl bg-gold px-6 text-sm font-semibold text-white hover:bg-gold-dark disabled:opacity-60"
          >
            {pending ? "Αποθήκευση…" : "Αποθήκευση αλλαγών"}
          </button>
        </div>
      </div>
    </form>
  );
}
