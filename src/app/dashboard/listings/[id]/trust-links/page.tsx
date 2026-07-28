import { getTranslations } from "next-intl/server";
import { ListingExternalLinksEditor } from "@/components/dashboard/ListingExternalLinksEditor";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOwnerListingExternalLinks } from "@/lib/listing-external-links-db";
import { loadListingWorkspace } from "@/lib/listing-workspace-server";

export default async function ListingTrustLinksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireDashboardContext("/dashboard/listings");
  await loadListingWorkspace(id, profile.id);
  const t = await getTranslations("Workspace.trustLinksPage");
  const externalLinks = await getOwnerListingExternalLinks(id, profile.id);

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-charcoal">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>
      <ListingExternalLinksEditor
        listingId={id}
        initialLinks={externalLinks}
        showCardChrome={false}
      />
    </div>
  );
}
