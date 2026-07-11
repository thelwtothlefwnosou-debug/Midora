"use client";

import { usePathname } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { ListingWorkspaceHeader } from "@/components/dashboard/listing-workspace/ListingWorkspaceHeader";
import { ListingWorkspaceTabs } from "@/components/dashboard/listing-workspace/ListingWorkspaceTabs";
import type { Profile } from "@/lib/types";
import type { ListingWorkspaceContext, ListingSwitcherItem } from "@/lib/listing-workspace-types";

type Props = {
  listingId: string;
  profile: Profile;
  email: string;
  ctx: ListingWorkspaceContext;
  switcherItems: ListingSwitcherItem[];
  children: React.ReactNode;
};

export function ListingWorkspaceLayoutGate({
  listingId,
  profile,
  email,
  ctx,
  switcherItems,
  children,
}: Props) {
  const pathname = usePathname();
  const isOwnerPreview = pathname?.endsWith("/view");

  if (isOwnerPreview) {
    return <>{children}</>;
  }

  return (
    <AccountShell
      profile={profile}
      email={email}
      active="listings"
      variant="workspace"
      title={ctx.listing.title}
      subtitle="Διαχείριση ακινήτου — διαθεσιμότητα, τιμές και αιτήματα."
    >
      <ListingWorkspaceHeader ctx={ctx} switcherItems={switcherItems} />
      <ListingWorkspaceTabs listingId={listingId} />
      {children}
    </AccountShell>
  );
}
