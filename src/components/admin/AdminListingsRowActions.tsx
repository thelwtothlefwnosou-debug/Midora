"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminListingActionModals } from "@/components/admin/AdminListingActionModals";

export function AdminListingsRowActions({
  listingId,
  isHidden,
  isPending,
}: {
  listingId: string;
  isHidden: boolean;
  isPending?: boolean;
}) {
  const router = useRouter();
  const [pending] = useTransition();

  return (
    <div className="flex min-w-[160px] flex-col gap-2">
      <Link
        href={`/admin/listings/${listingId}`}
        className="inline-flex items-center justify-center rounded-lg bg-charcoal px-3 py-2 text-xs font-semibold text-white hover:bg-charcoal/90"
      >
        Προβολή &amp; έλεγχος
      </Link>
      {isPending ? (
        <AdminListingActionModals
          listingId={listingId}
          isHidden={isHidden}
          compact
          showHide={false}
          onSuccess={() => router.refresh()}
        />
      ) : (
        <AdminListingActionModals
          listingId={listingId}
          isHidden={isHidden}
          compact
          showReviewActions={false}
          onSuccess={() => router.refresh()}
        />
      )}
      {pending && <span className="text-[10px] text-muted">Επεξεργασία…</span>}
    </div>
  );
}
