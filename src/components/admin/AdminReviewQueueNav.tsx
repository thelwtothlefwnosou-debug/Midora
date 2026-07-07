"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  listingId: string;
  queueIds: string[];
  backHref: string;
};

export function AdminReviewQueueNav({ listingId, queueIds, backHref }: Props) {
  const idx = queueIds.indexOf(listingId);
  const prevId = idx > 0 ? queueIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < queueIds.length - 1 ? queueIds[idx + 1] : null;

  if (queueIds.length <= 1) {
    return (
      <Link href={backHref} className="text-sm text-muted hover:text-gold">
        ← Πίσω στη λίστα
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href={backHref} className="text-sm text-muted hover:text-gold">
        ← Πίσω στη λίστα
      </Link>
      <div className="flex items-center gap-2 text-sm text-muted">
        {prevId ? (
          <Link
            href={`/admin/listings/${prevId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 hover:bg-sand"
          >
            <ChevronLeft className="h-4 w-4" />
            Προηγούμενη
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 opacity-40">
            <ChevronLeft className="h-4 w-4" />
            Προηγούμενη
          </span>
        )}
        <span className="tabular-nums">
          {idx + 1} / {queueIds.length}
        </span>
        {nextId ? (
          <Link
            href={`/admin/listings/${nextId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 hover:bg-sand"
          >
            Επόμενη
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 opacity-40">
            Επόμενη
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
