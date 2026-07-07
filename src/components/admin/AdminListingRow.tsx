"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminListingActionModals } from "@/components/admin/AdminListingActionModals";
import { AdminRegistryCell } from "@/components/admin/AdminRegistryCell";
import { getListingCompleteness } from "@/lib/admin/listing-completeness";
import { isPreviewV80 } from "@/lib/preview-v80";
import type { ListingWithImages } from "@/lib/types";
import {
  listingRentalType,
  rentalTypeLabel,
  VERIFICATION_STATUS_LABELS,
} from "@/lib/rental-types";

export function AdminListingRow({ listing }: { listing: ListingWithImages }) {
  const router = useRouter();
  const rentalType = listingRentalType(listing);
  const canApprove = isPreviewV80
    ? getListingCompleteness(listing).missingLabels.length === 0
    : true;

  return (
    <tr className="border-b border-border align-top">
      <td className="px-3 py-4">
        <p className="font-medium text-charcoal">{listing.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {listing.area}, {listing.city}
        </p>
      </td>
      <td className="px-3 py-4 text-sm text-muted">
        {listing.profiles?.full_name ?? "—"}
      </td>
      <td className="px-3 py-4 text-sm">{rentalTypeLabel(rentalType)}</td>
      <td className="px-3 py-4">
        <AdminRegistryCell listing={listing} />
      </td>
      <td className="px-3 py-4 text-sm">
        {VERIFICATION_STATUS_LABELS[listing.advertiser_verification_status ?? "not_started"]}
      </td>
      <td className="px-3 py-4 text-sm">
        {VERIFICATION_STATUS_LABELS[listing.property_verification_status ?? "not_started"]}
      </td>
      <td className="px-3 py-4 text-sm">
        {listing.approval_status ?? listing.status}
      </td>
      <td className="px-3 py-4">
        <div className="flex min-w-[180px] flex-col gap-2">
          <Link
            href={`/admin/listings/${listing.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-charcoal px-3 py-2 text-xs font-semibold text-white hover:bg-charcoal/90"
          >
            Προβολή &amp; έλεγχος
          </Link>
          <AdminListingActionModals
            listingId={listing.id}
            compact
            showHide={false}
            canApprove={canApprove}
            onSuccess={() => router.refresh()}
          />
        </div>
      </td>
    </tr>
  );
}
