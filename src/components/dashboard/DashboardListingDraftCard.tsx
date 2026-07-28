"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, MoreHorizontal, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { DeleteListingButton } from "@/components/dashboard/DeleteListingButton";
import type { ListingWithImages } from "@/lib/types";
import { getListingPublicId } from "@/lib/utils";
import { pickListingCoverPhotoUrl } from "@/lib/listing-media";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingWithImages;
  onDeleted?: (listingId: string) => void;
};

function formatDraftPrice(listing: ListingWithImages): string {
  if (listing.price_per_night && listing.price_per_night > 0) {
    return `€${listing.price_per_night.toLocaleString("el-GR")}`;
  }
  if (listing.price_monthly && listing.price_monthly > 0) {
    return `€${listing.price_monthly.toLocaleString("el-GR")}`;
  }
  return "€–";
}

function formatDraftDate(iso: string): string {
  return new Date(iso).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DashboardListingDraftCard({ listing, onDeleted }: Props) {
  const t = useTranslations("Owner.list");
  const resumeHref = `/dashboard/listings/new?draft=${listing.id}`;
  const cover = pickListingCoverPhotoUrl(listing);
  const publicId = getListingPublicId(listing);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 sm:w-44 md:w-52">
          {cover ? (
            <Image
              src={cover}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="208px"
            />
          ) : (
            <div className="flex h-full min-h-[120px] w-full items-center justify-center bg-sand/50">
              <span className="text-xs text-muted">{t("noPhoto")}</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-charcoal/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
            #{publicId.slice(-8)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-charcoal">{listing.title}</h3>
              <p className="mt-0.5 text-lg font-semibold text-charcoal">{formatDraftPrice(listing)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={resumeHref}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/60 hover:bg-sand hover:text-gold"
                title={t("resumeListingTitle")}
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <details className="relative">
                <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-charcoal/60 hover:bg-sand hover:text-charcoal [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-10 mt-1 min-w-[140px] rounded-xl border border-border bg-white p-2 shadow-card">
                  <DeleteListingButton listingId={listing.id} onDeleted={onDeleted} />
                </div>
              </details>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-charcoal/20 px-2 py-0.5 font-semibold uppercase tracking-wide text-charcoal">
              {t("draftBadge")}
            </span>
            <span className="flex items-center gap-1 text-muted">
              <Clock className="h-3 w-3" />
              {formatDraftDate(listing.updated_at ?? listing.created_at)}
            </span>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="flex items-start gap-2 text-xs text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {t("completeListingHint")}
            </p>
            <Link
              href={resumeHref}
              className={cn(
                "shrink-0 rounded-xl border border-teal px-4 py-2 text-sm font-semibold text-teal",
                "hover:bg-teal/5"
              )}
            >
              {t("continueCreating")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
