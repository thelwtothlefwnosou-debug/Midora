import { NewListingWizard } from "./NewListingWizard";
import { requireDashboardContext } from "@/lib/dashboard-context";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { profile, email } = await requireDashboardContext("/dashboard/listings/new");
  const { draft } = await searchParams;
  return (
    <NewListingWizard
      profile={profile}
      email={email}
      initialListingId={draft?.trim() || null}
    />
  );
}
