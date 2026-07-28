"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { submitPropertyLead } from "@/lib/actions";
import { getListingPublicId } from "@/lib/utils";
import type { ListingWithImages } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { InterestPrefill } from "@/components/listings/ListingInterestContext";
import {
  formatInterestRangeLabel,
  formatMonthLabel,
} from "@/lib/search-interest-dates";

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

function resolveRentalMode(prefill?: InterestPrefill): "short_term" | "monthly" {
  if (prefill?.rentalMode) return prefill.rentalMode;
  if (prefill?.interestStartMonth) return "monthly";
  return "short_term";
}

function InquirySummary({
  prefill,
  t,
}: {
  prefill?: InterestPrefill;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (!prefill) return null;

  const rows: { label: string; value: string }[] = [];

  if (prefill.interestStartDate && prefill.interestEndDate) {
    rows.push({
      label: t("dates"),
      value: formatInterestRangeLabel(prefill.interestStartDate, prefill.interestEndDate),
    });
  } else if (prefill.interestStartMonth) {
    rows.push({
      label: t("startMonth"),
      value: formatMonthLabel(prefill.interestStartMonth),
    });
  }

  if (prefill.interestDurationMonths != null) {
    rows.push({
      label: t("duration"),
      value: `${prefill.interestDurationMonths} ${
        prefill.interestDurationMonths === 1 ? t("monthSingular") : t("monthPlural")
      }`,
    });
  } else if (prefill.duration?.trim()) {
    rows.push({ label: t("duration"), value: prefill.duration.trim() });
  }

  if (prefill.guests != null) {
    rows.push({
      label: t("people"),
      value: `${prefill.guests} ${
        prefill.guests === 1 ? t("person") : t("peoplePlural")
      }`,
    });
  }

  if (!rows.length) return null;

  return (
    <div className="rounded-xl border border-charcoal/10 bg-sand/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {t("yourChoices")}
      </p>
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
  const tLegal = useTranslations("Legal.shared");
  const t = useTranslations("Listing.inquiry");
  const tCommon = useTranslations("Common");
  const isMessage = prefill?.intent === "message";
  const rentalMode = resolveRentalMode(prefill);
  const isMonthly = rentalMode === "monthly" || Boolean(prefill?.interestStartMonth);

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
  const [message, setMessage] = useState(
    prefill?.message ?? (isMessage ? "" : t("defaultMessage"))
  );
  const [preferredReply, setPreferredReply] = useState<"phone" | "email" | "message">(
    isMessage ? "message" : "phone"
  );
  const [roleAcknowledged, setRoleAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const listingHref = `/listings/${getListingPublicId(listing)}`;
  const modalTitle = (() => {
    if (success) return t("titleSuccess");
    if (isMessage) {
      return isMonthly ? t("titleMessageOwner") : t("titleMessageHost");
    }
    if (prefill?.interestStartMonth) return t("titleRentalRequest");
    if (prefill?.interestStartDate) return t("titleAvailabilityRequest");
    return t("titleContactOwner");
  })();
  const inquiryAck = isMonthly ? tLegal("inquiryAckMonthly") : tLegal("inquiryAckShort");
  const depositLine = isMonthly ? tLegal("depositMonthly") : tLegal("depositShort");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t("errorName"));
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError(t("errorContact"));
      return;
    }
    if (!roleAcknowledged) {
      setError(t("errorRole"));
      return;
    }
    if (isMessage && !message.trim()) {
      setError(t("errorMessage"));
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
      phone: t("replyChannelPhone"),
      email: t("replyChannelEmail"),
      message: t("replyChannelMessage"),
    } as const;
    const body = message.trim();
    const withPreference = `${t("preferReplyPrefix", {
      channel: replyLabels[preferredReply],
    })}\n\n${body || (isMessage ? t("messagePlaceholder") : t("defaultMessage"))}`;
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
          <h2
            id="property-contact-modal-title"
            className="font-display text-lg font-semibold text-charcoal"
          >
            {modalTitle}
          </h2>
          {!success && (
            <>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">{listing.title}</p>
              {isMessage ? (
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {t("messageHelper")}
                </p>
              ) : null}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-charcoal/5"
          aria-label={t("close")}
        >
          <X className="h-5 w-5 text-muted" />
        </button>
      </div>

      {success ? (
        <div className="overflow-y-auto px-5 py-6">
          <p className="text-sm leading-relaxed text-charcoal/75">
            {isMessage ? t("titleSuccess") : tCommon("interestSuccessText")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {t("emailMayDelay")}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/listings?rentalType=short_term"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-dark"
            >
              {t("continueSearch")}
            </Link>
            <Link
              href={listingHref}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-charcoal hover:border-gold/30"
            >
              {t("viewListing")}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="overflow-y-auto overscroll-contain px-5 py-5">
          <div className="space-y-4">
            <InquirySummary prefill={prefill} t={t} />

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("nameRequired")}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("email")}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("mobile")}
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
                />
              </label>
            </div>
            <p className="text-xs text-muted">{t("emailOrMobileRequired")}</p>

            {!isMessage ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("preferReplyVia")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { id: "phone" as const, label: t("preferPhone") },
                      { id: "email" as const, label: t("preferEmail") },
                      { id: "message" as const, label: t("preferMessage") },
                    ]
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
            ) : null}

            {!isMessage && !hasStructuredDates && (
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("whenApprox")}
                </span>
                <input
                  value={timingNote}
                  onChange={(e) => setTimingNote(e.target.value)}
                  placeholder={t("whenPlaceholder")}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/50 focus:border-gold/50"
                />
              </label>
            )}

            {!isMessage && !hasStructuredDuration && (
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("estimatedDuration")}
                </span>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t("durationPlaceholder")}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none placeholder:text-muted/50 focus:border-gold/50"
                />
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("messageLabel")}
              </span>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isMessage ? t("messagePlaceholder") : t("defaultMessage")}
                className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
              />
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-4 space-y-3 rounded-xl border border-border bg-sand/25 px-3.5 py-3">
            <p className="text-xs font-semibold tracking-wide text-charcoal/70 uppercase">
              {tLegal("safeCommTitle")}
            </p>
            {isMessage ? (
              <p className="text-xs leading-relaxed text-muted">
                {tLegal("messageModalSafety")}
              </p>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-muted">{inquiryAck}</p>
                <p className="text-xs leading-relaxed text-muted">{depositLine}</p>
              </>
            )}
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-charcoal/80">
              <input
                type="checkbox"
                checked={roleAcknowledged}
                onChange={(e) => setRoleAcknowledged(e.target.checked)}
                className="mt-0.5 accent-gold"
              />
              <span>{tLegal("inquiryRoleCheckbox")}</span>
            </label>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            {tCommon("leadPrivacyNotice")}
          </p>

          <div className="sticky bottom-0 mt-6 flex gap-2 border-t border-border bg-white pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-xl border border-border text-sm font-medium text-charcoal hover:bg-charcoal/5"
            >
              {isMessage ? t("cancel") : t("dismiss")}
            </button>
            <button
              type="submit"
              disabled={pending || !roleAcknowledged}
              className={cn(
                "min-h-11 flex-1 rounded-xl bg-gold text-sm font-semibold text-white hover:bg-gold-dark",
                (pending || !roleAcknowledged) && "opacity-60"
              )}
            >
              {pending
                ? t("submitting")
                : isMessage
                  ? t("sendMessage")
                  : tCommon("submitInterest")}
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
  const t = useTranslations("Listing.inquiry");

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
        aria-label={t("close")}
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
