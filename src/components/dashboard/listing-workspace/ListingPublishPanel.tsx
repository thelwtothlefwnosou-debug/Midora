"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { OwnerListingStatusKey } from "@/lib/dashboard-listings";
import { ownerStatusKeyToLabelKey } from "@/lib/owner-listing-ui-status";

type Props = {
  listingId: string;
  publicId: string;
  ownerStatusKey: OwnerListingStatusKey;
  ownerStatusLabel: string;
  expiresLabel: string | null;
  publishedLabel: string | null;
  isFree: boolean;
  externalLinkCount?: number;
  publicExternalLinkCount?: number;
};

const STATUS_KEYS: Partial<Record<OwnerListingStatusKey, string>> = {
  published: "statusPublished",
  paused: "statusPaused",
  review: "statusReview",
  draft: "statusDraft",
  needs_fixes: "statusNeedsFixes",
  expired: "statusExpired",
  rejected: "statusRejected",
};

export function ListingPublishPanel({
  listingId,
  publicId,
  ownerStatusKey,
  ownerStatusLabel,
  expiresLabel,
  publishedLabel,
  isFree,
  externalLinkCount = 0,
  publicExternalLinkCount = 0,
}: Props) {
  const t = useTranslations("Workspace.publish");
  const tUi = useTranslations("Owner.uiStatus");
  const [copied, setCopied] = useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/listings/${publicId}`
      : `/listings/${publicId}`;
  const statusKey = STATUS_KEYS[ownerStatusKey];
  const statusNote = statusKey ? t(statusKey) : null;
  const statusDisplay = tUi(ownerStatusKeyToLabelKey(ownerStatusKey));
  const showPublic =
    ownerStatusKey === "published" || ownerStatusKey === "paused";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/listings/${publicId}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {statusNote && (
        <p className="rounded-xl border border-border bg-sand/25 px-4 py-3 text-sm text-charcoal">
          {statusNote}
        </p>
      )}

      <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-soft sm:p-5">
        <h3 className="font-display text-sm font-semibold text-charcoal">{t("trustTitle")}</h3>
        <p className="mt-2 text-sm text-muted">{t("trustBody")}</p>
        {externalLinkCount > 0 ? (
          <p className="mt-2 text-xs text-muted">
            {t("trustCounts", {
              saved: externalLinkCount,
              public: publicExternalLinkCount,
            })}
          </p>
        ) : (
          <p className="mt-2 text-xs text-gold-dark">{t("trustEmpty")}</p>
        )}
        <Link
          href={`/dashboard/listings/${listingId}/trust-links`}
          className="mt-3 inline-flex min-h-9 items-center rounded-xl border border-border px-4 text-sm font-medium text-charcoal hover:border-gold/30 hover:bg-sand"
        >
          {externalLinkCount > 0 ? t("manageLinks") : t("addLink")}
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("status")}</dt>
            <dd className="font-medium text-charcoal">{statusDisplay}</dd>
          </div>
          {expiresLabel &&
            (ownerStatusKey === "published" ||
              ownerStatusKey === "paused" ||
              ownerStatusKey === "expired") && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("activeUntil")}</dt>
                <dd className="font-medium text-charcoal">{expiresLabel}</dd>
              </div>
            )}
          {publishedLabel && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("published")}</dt>
              <dd className="font-medium text-charcoal">{publishedLabel}</dd>
            </div>
          )}
          {showPublic && (
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-muted">{t("publicLink")}</dt>
              <dd className="max-w-[60%] truncate font-mono text-xs text-charcoal">
                /listings/{publicId}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button href={`/dashboard/listings/${listingId}/view`} size="sm" variant="outline">
          <Eye className="h-3.5 w-3.5" />
          {t("preview")}
        </Button>
        {showPublic && (
          <>
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("publicListing")}
            </Link>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("copied") : t("copyLink")}
            </button>
          </>
        )}
        {(ownerStatusKey === "expired" ||
          ownerStatusKey === "draft" ||
          ownerStatusKey === "needs_fixes") && (
          <Button href={`/dashboard/listings/${listingId}/pay`} size="sm">
            {ownerStatusKey === "expired" ? t("renew") : t("submitRenew")}
          </Button>
        )}
        {(ownerStatusKey === "draft" || ownerStatusKey === "needs_fixes") && (
          <Link
            href={`/dashboard/listings/new?draft=${listingId}`}
            className="inline-flex min-h-9 items-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90"
          >
            {t("continueDraft")}
          </Link>
        )}
      </div>

      {isFree && <p className="text-xs text-muted">{t("launchOffer")}</p>}
    </div>
  );
}
