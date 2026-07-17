"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Calendar,
  Mail,
  Phone,
  Archive,
  CheckCircle2,
  ExternalLink,
  Users,
  Home,
} from "lucide-react";
import type { PropertyLeadWithListing, PropertyLeadReply } from "@/lib/types";
import { updatePropertyLeadStatus } from "@/lib/actions";
import { replyToPropertyLead } from "@/lib/listing-cohost-actions";
import { leadStatusLabel } from "@/lib/lead-labels";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  new: "bg-gold/15 text-gold-dark",
  read: "bg-teal/10 text-teal",
  replied: "bg-charcoal/10 text-charcoal",
  archived: "bg-sand text-muted",
};

function listingCoverUrl(listing: NonNullable<PropertyLeadWithListing["listings"]>): string | null {
  const images = listing.listing_images ?? [];
  const cover =
    images.find((i) => i.is_cover && i.media_type !== "video") ??
    images.find((i) => i.media_type !== "video");
  return cover?.url ?? null;
}

function formatInterestDates(lead: PropertyLeadWithListing): string | null {
  if (lead.interest_start_date && lead.interest_end_date) {
    const fmt = new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" });
    return `${fmt.format(new Date(lead.interest_start_date))} – ${fmt.format(new Date(lead.interest_end_date))}`;
  }
  if (lead.interest_start_month) {
    const [year, month] = lead.interest_start_month.split("-");
    if (year && month) {
      const label = new Intl.DateTimeFormat("el-GR", {
        month: "long",
        year: "numeric",
      }).format(new Date(Number(year), Number(month) - 1, 1));
      if (lead.interest_duration_months) {
        return `${label} · ${lead.interest_duration_months} μήνες`;
      }
      return label;
    }
  }
  if (lead.start_date) {
    return new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(
      new Date(lead.start_date)
    );
  }
  return null;
}

export function PropertyLeadRow({
  lead,
  replies = [],
}: {
  lead: PropertyLeadWithListing;
  replies?: PropertyLeadReply[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leadStatus, setLeadStatus] = useState(lead.status);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const listing = lead.listings;
  const listingHref = listing ? `/listings/${listing.slug ?? listing.id}` : null;
  const cover = listing ? listingCoverUrl(listing) : null;
  const interestDates = formatInterestDates(lead);

  function changeStatus(next: "read" | "replied" | "archived") {
    setActionError(null);
    startTransition(async () => {
      const result = await updatePropertyLeadStatus(lead.id, next);
      if ("error" in result && result.error) {
        setActionError(result.error);
        return;
      }
      setLeadStatus(next);
      router.refresh();
    });
  }

  function submitReply() {
    setActionError(null);
    startTransition(async () => {
      const result = await replyToPropertyLead(lead.id, replyText);
      if ("error" in result && result.error) {
        setActionError(result.error);
        return;
      }
      setReplyText("");
      setShowReply(false);
      setLeadStatus("replied");
      router.refresh();
    });
  }

  function replySenderLabel(reply: PropertyLeadReply): string {
    if (reply.sender_role === "cohost") {
      return `${reply.sender_display_name}, συνοικοδεσπότης, απάντησε`;
    }
    return `${reply.sender_display_name} απάντησε`;
  }

  const created = new Intl.DateTimeFormat("el-GR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(lead.created_at));

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-36 shrink-0 bg-sand sm:h-auto sm:w-40">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- avoid next/image hostname crashes
            <img
              src={cover}
              alt={listing?.title ?? "Αγγελία"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[9rem] items-center justify-center">
              <Home className="h-8 w-8 text-muted/40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-charcoal">{lead.name}</p>
              {listing && (
                <p className="mt-1 text-sm text-muted">
                  {listing.title} · {listing.area}, {listing.city}
                </p>
              )}
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                STATUS_STYLE[leadStatus] ?? STATUS_STYLE.new
              )}
            >
              {leadStatusLabel(leadStatus)}
            </span>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-charcoal/75 sm:grid-cols-2">
            {lead.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gold/80" />
                <a href={`mailto:${lead.email}`} className="hover:text-gold-dark">
                  {lead.email}
                </a>
              </p>
            )}
            {lead.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold/80" />
                <a href={`tel:${lead.phone}`} className="hover:text-gold-dark">
                  {lead.phone}
                </a>
              </p>
            )}
            {interestDates && (
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-gold/80" />
                {interestDates}
              </p>
            )}
            {lead.guests != null && lead.guests > 0 && (
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-gold/80" />
                {lead.guests} {lead.guests === 1 ? "άτομο" : "άτομα"}
              </p>
            )}
            {lead.timing_note && (
              <p className="flex items-center gap-2 sm:col-span-2">
                <Calendar className="h-4 w-4 shrink-0 text-gold/80" />
                Πότε: {lead.timing_note}
              </p>
            )}
            {lead.duration && (
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-gold/80" />
                Εκτιμώμενη διάρκεια: {lead.duration}
              </p>
            )}
          </div>

          {lead.message && (
            <p className="mt-4 rounded-xl bg-sand/50 px-4 py-3 text-sm leading-relaxed text-charcoal/75">
              {lead.message}
            </p>
          )}

          {replies.length > 0 && (
            <div className="mt-4 space-y-2">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <p className="text-xs font-medium text-muted">
                    {replySenderLabel(reply)}
                  </p>
                  <p className="mt-1 leading-relaxed text-charcoal/80">{reply.body}</p>
                </div>
              ))}
            </div>
          )}

          {showReply ? (
            <div className="mt-4 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Γράψε την απάντησή σου..."
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || !replyText.trim()}
                  onClick={submitReply}
                  className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Αποστολή απάντησης
                </button>
                <button
                  type="button"
                  onClick={() => setShowReply(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted"
                >
                  Ακύρωση
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowReply(true)}
              className="mt-4 text-sm font-medium text-gold-dark hover:underline"
            >
              Απάντηση στον επισκέπτη
            </button>
          )}

          <p className="mt-3 text-xs text-muted">Λήφθηκε: {created}</p>
          {actionError && (
            <p className="mt-2 text-sm text-red-600">{actionError}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {listingHref && (
              <Link
                href={listingHref}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:border-gold/30"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Προβολή ακινήτου
              </Link>
            )}
            {leadStatus === "new" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => changeStatus("read")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-teal/10 px-3 text-xs font-medium text-teal hover:bg-teal/15 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Σημείωση ως αναγνωσμένο
              </button>
            )}
            {(leadStatus === "new" || leadStatus === "read") && (
              <button
                type="button"
                disabled={pending}
                onClick={() => changeStatus("replied")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
              >
                Απαντήθηκε
              </button>
            )}
            {leadStatus !== "archived" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => changeStatus("archived")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted hover:text-charcoal disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                Αρχειοθέτηση
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
