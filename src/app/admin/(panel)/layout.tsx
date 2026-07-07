import { Suspense } from "react";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminOverviewStats } from "@/lib/admin/queries";
import { isPreviewV80 } from "@/lib/preview-v80";
import type { AdminNavBadgeKey } from "@/lib/admin/nav";

function AdminShellFallback() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-[1480px] px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-sand/60" />
      </div>
    </div>
  );
}

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, email } = await requireAdminContext("/admin");

  let badges: Partial<Record<AdminNavBadgeKey, number>> | undefined;

  if (isPreviewV80) {
    const stats = await getAdminOverviewStats();
    badges = {
      review: stats.pendingReview,
      "listing-reports": stats.listingReports,
      verifications: stats.pendingVerifications,
      "bug-reports": stats.bugReports,
    };
  }

  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminShell profileName={profile.full_name ?? "Admin"} email={email} navBadges={badges}>
        {children}
      </AdminShell>
    </Suspense>
  );
}
