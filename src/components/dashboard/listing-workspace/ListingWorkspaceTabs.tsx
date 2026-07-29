"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { resolveListingWorkspaceTab } from "@/lib/listing-workspace-nav";
import { visibleWorkspaceTabs } from "@/lib/listing-workspace-tab-visibility";
import type { CohostPermissionFlags } from "@/lib/listing-cohost-permissions";
import type { ListingAccessRole } from "@/lib/listing-access";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  role: ListingAccessRole;
  permissions: CohostPermissionFlags;
  rentalType: RentalType;
};

export function ListingWorkspaceTabs({
  listingId,
  role,
  permissions,
  rentalType,
}: Props) {
  const t = useTranslations("Workspace");
  const pathname = usePathname() ?? "";
  const active = resolveListingWorkspaceTab(pathname, listingId);
  const tabs = visibleWorkspaceTabs(role, permissions, rentalType);
  const isShortTerm = rentalType === "short_term";

  return (
    <nav
      className="sticky top-0 z-20 -mx-3 mb-5 border-b border-border/70 bg-cream/90 px-3 backdrop-blur-md sm:-mx-5 sm:px-5"
      aria-label={t("tabsAria")}
    >
      <div className="flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const label =
            tab.id === "availability" && isShortTerm
              ? t("tabs.calendarPricing")
              : t(`tabs.${tab.id}`);
          return (
            <Link
              key={tab.id}
              href={tab.href(listingId)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-charcoal text-white shadow-soft"
                  : "text-muted hover:bg-white/80 hover:text-charcoal"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
