import {
  LISTING_WORKSPACE_TABS,
  type ListingWorkspaceTab,
  type ListingWorkspaceTabId,
} from "@/lib/listing-workspace-nav";
import type { CohostPermissionFlags } from "@/lib/listing-cohost-permissions";
import type { ListingAccessRole } from "@/lib/listing-access";

export function isWorkspaceTabVisible(
  tabId: ListingWorkspaceTabId,
  role: ListingAccessRole,
  permissions: CohostPermissionFlags
): boolean {
  if (role === "owner") return true;

  switch (tabId) {
    case "overview":
      return true;
    case "edit":
      return permissions.can_manage_listing;
    case "photos":
      return permissions.can_manage_photos;
    case "availability":
      return permissions.can_manage_availability || permissions.can_manage_pricing;
    case "inquiries":
      return permissions.can_manage_messages;
    case "analytics":
      return permissions.can_view_stats;
    case "publish":
    case "cohosts":
      return false;
    default:
      return false;
  }
}

export function visibleWorkspaceTabs(
  role: ListingAccessRole,
  permissions: CohostPermissionFlags
): ListingWorkspaceTab[] {
  return LISTING_WORKSPACE_TABS.filter((tab) =>
    isWorkspaceTabVisible(tab.id, role, permissions)
  );
}
