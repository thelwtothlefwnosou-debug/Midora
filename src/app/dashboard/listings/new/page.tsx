import { NewListingWizard } from "./NewListingWizard";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getWizardListingDraft } from "@/lib/actions";
import { resolveInitialWizardStep } from "@/lib/listing-wizard-resume";
import type { ListingImage } from "@/lib/types";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; step?: string }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/listings/new");
  const { draft, step: stepQuery } = await searchParams;
  const draftId = draft?.trim() || null;

  let initialResumeStep: number | null = null;
  let initialResumeMessage: string | null = null;
  let initialDraftListing: Record<string, unknown> | null = null;
  let initialPhotoCount = 0;
  let initialImages: ListingImage[] = [];

  if (draftId) {
    const result = await getWizardListingDraft(draftId);
    if ("listing" in result && result.listing) {
      initialDraftListing = result.listing as Record<string, unknown>;
      initialPhotoCount = result.photoCount ?? 0;
      initialImages = Array.isArray(result.images) ? result.images : [];
      const resolved = resolveInitialWizardStep(
        result.listing as Record<string, unknown>,
        {
          photoCount: initialPhotoCount,
          queryStep: stepQuery?.trim() || null,
        }
      );
      initialResumeStep = resolved.stepNumber;
      initialResumeMessage = resolved.message ?? null;
    }
  }

  return (
    <NewListingWizard
      profile={profile}
      email={email}
      initialListingId={draftId}
      initialResumeStep={initialResumeStep}
      initialResumeMessage={initialResumeMessage}
      initialDraftListing={initialDraftListing}
      initialPhotoCount={initialPhotoCount}
      initialImages={initialImages}
    />
  );
}
