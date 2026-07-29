"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Owner.profileForm");
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
    if (saveUi === "saving") return t("saving");
    if (saveUi === "saved" && !dirty) return t("saved");
    if (saveUi === "error") return t("saveError");
    if (dirty) return t("unsavedChanges");
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
      <section className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6">
        <p className="text-[11px] font-medium tracking-wide text-gold-dark uppercase">
          {t("publicBadge")}
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-charcoal">
          {t("publicProfileTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("publicProfileSubtitle")}</p>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="display_name" className="text-xs font-medium text-muted uppercase">
              {t("displayName")}
            </label>
            <input
              id="display_name"
              name="display_name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                markDirty();
              }}
              placeholder={profile.full_name ?? t("displayNamePlaceholder")}
              className={fieldClassName()}
            />
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-muted uppercase">
              {t("advertiserType")}
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(
                [
                  { value: "individual", label: t("individual") },
                  { value: "professional", label: t("professional") },
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
              {t("bio")}
              <span className="ml-1 font-normal normal-case text-muted/80">{t("optional")}</span>
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
              placeholder={t("bioPlaceholder")}
              className={cn(fieldClassName(), "min-h-[100px] resize-y")}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {bio.length}/{PROFILE_BIO_MAX}
            </p>
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-muted uppercase">
              {t("languages")}
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
              {t("publicUrl")}
              <span className="ml-1 font-normal normal-case text-muted/80">{t("optional")}</span>
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
              {t("publicUrlHint")}
            </p>
            {previewPublicHref && publicProfileEnabled ? (
              <Link
                href={previewPublicHref}
                target="_blank"
                className="mt-2 inline-block text-sm font-medium text-gold hover:underline"
              >
                {t("previewPublicProfile")}
              </Link>
            ) : null}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-muted uppercase">{t("visibilitySettings")}</legend>
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
                  {t("allowPublicProfile")}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{t("allowPublicProfileHint")}</span>
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
              <span className="text-sm text-charcoal">{t("showOwnedListings")}</span>
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
                {t("showCohostedListings")}
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

      <section className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {t("privateBadge")}
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-charcoal">
          {t("contactDetailsTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("contactDetailsSubtitle")}</p>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="full_name" className="text-xs font-medium text-muted uppercase">
              {advertiserType === "professional" ? t("responsibleFullName") : t("fullName")}
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
                  {t("businessName")}
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
                  {t("businessTitle")}
                </label>
                <input
                  id="business_title"
                  name="business_title"
                  value={businessTitle}
                  onChange={(e) => {
                    setBusinessTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder={t("businessTitlePlaceholder")}
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
            <label className="text-xs font-medium text-muted uppercase">{t("phone")}</label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                value={profile.phone || "—"}
                readOnly
                className={cn(fieldClassName(), "flex-1 bg-sand/40 text-muted")}
              />
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                  <BadgeCheck className="h-3 w-3" />
                  {t("verified")}
                </span>
              )}
            </div>
            <Link
              href="/dashboard/settings/contact"
              className="mt-2 inline-block text-sm font-medium text-gold hover:underline"
            >
              {t("managePhone")}
            </Link>
          </div>

          <div>
            <label htmlFor="preferred_contact_method" className="text-xs font-medium text-muted uppercase">
              {t("preferredContact")}
            </label>
            <select
              id="preferred_contact_method"
              name="preferred_contact_method"
              defaultValue={profile.preferred_contact_method ?? "message"}
              className={fieldClassName()}
            >
              {PREFERRED_CONTACT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "message"
                    ? t("preferredContactMessage")
                    : opt.value === "phone"
                      ? t("preferredContactPhone")
                      : t("preferredContactEmail")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-border bg-sand/30 px-4 py-3 text-sm text-muted">
          {t("privacyNote")}
        </p>
      </section>

      {saveUi === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p className="font-medium">{t("saveError")}</p>
          {state?.error && <p className="mt-1 text-red-500/90">{state.error}</p>}
          <button type="submit" className="mt-2 font-medium text-red-700 underline">
            {t("retry")}
          </button>
        </div>
      )}

      {saveUi === "saved" && !dirty && (
        <p className="text-sm text-teal">{t("saved")}</p>
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
            {pending ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </div>
    </form>
  );
}
