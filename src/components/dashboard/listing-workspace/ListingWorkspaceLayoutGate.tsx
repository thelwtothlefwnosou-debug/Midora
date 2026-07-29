"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Workspace.layoutGate");

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
      subtitle={t("subtitle")}
    >
      <ListingWorkspaceHeader ctx={ctx} switcherItems={switcherItems} />
      <ListingWorkspaceTabs
        listingId={listingId}
        role={ctx.access.role}
        permissions={ctx.permissions}
        rentalType={ctx.rentalType}
      />
      {children}
    </AccountShell>
  );
}
