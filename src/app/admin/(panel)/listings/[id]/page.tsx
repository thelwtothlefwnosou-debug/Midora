import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAdminListingById,
  getAdminListingOwnerStats,
  getAdminListingReportsForListing,
  getAdminPriceRulesForListing,
  getAdminUnavailableForListing,
} from "@/lib/admin/queries";
import { adminGetListingApprovalChecklist } from "@/lib/admin/actions";
import { AdminListingDetail } from "@/components/admin/AdminListingDetail";
import { AdminReviewQueueNav } from "@/components/admin/AdminReviewQueueNav";
import { getPendingListings } from "@/lib/listings";
import { isPreviewV80 } from "@/lib/preview-v80";
import type { ListingWithImages } from "@/lib/types";

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, reports, unavailablePeriods, priceRules, checklistResult] =
    await Promise.all([
      getAdminListingById(id),
      getAdminListingReportsForListing(id),
      getAdminUnavailableForListing(id),
      getAdminPriceRulesForListing(id),
      adminGetListingApprovalChecklist(id),
    ]);

  if (!listing) notFound();

  const ownerStats = listing.user_id
    ? await getAdminListingOwnerStats(listing.user_id)
    : undefined;

  const checklist =
    checklistResult && "checklist" in checklistResult
      ? checklistResult.checklist
      : undefined;

  const backHref = "/admin/listings/review";
  const queueIds = isPreviewV80
    ? (await getPendingListings()).map((l) => l.id)
    : [];

  return (
    <div className="space-y-4">
      {isPreviewV80 && queueIds.length > 0 ? (
        <AdminReviewQueueNav listingId={id} queueIds={queueIds} backHref={backHref} />
      ) : (
        <Link href={backHref} className="text-sm text-muted hover:text-gold">
          ← Πίσω στον έλεγχο αγγελιών
        </Link>
      )}
      <AdminListingDetail
        listing={listing as ListingWithImages}
        reports={reports}
        unavailablePeriods={unavailablePeriods}
        priceRules={priceRules}
        ownerStats={ownerStats}
        checklist={checklist}
      />
    </div>
  );
}
