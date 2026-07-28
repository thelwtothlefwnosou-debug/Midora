"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { resolveListingWorkspaceTab } from "@/lib/listing-workspace-nav";
import { visibleWorkspaceTabs } from "@/lib/listing-workspace-tab-visibility";
import type { CohostPermissionFlags } from "@/lib/listing-cohost-permissions";
import type { ListingAccessRole } from "@/lib/listing-access";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  role: ListingAccessRole;
  permissions: CohostPermissionFlags;
};

export function ListingWorkspaceTabs({ listingId, role, permissions }: Props) {
  const t = useTranslations("Workspace");
  const pathname = usePathname() ?? "";
  const active = resolveListingWorkspaceTab(pathname, listingId);
  const tabs = visibleWorkspaceTabs(role, permissions);

  return (
    <nav
      className="sticky top-0 z-20 -mx-3 mb-5 border-b border-border bg-cream/95 px-3 backdrop-blur-sm sm:-mx-5 sm:px-5"
      aria-label={t("tabsAria")}
    >
      <div className="flex gap-0.5 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href(listingId)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "border-charcoal text-charcoal"
                  : "border-transparent text-muted hover:border-charcoal/20 hover:text-charcoal"
              )}
            >
              {t(`tabs.${tab.id}`)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
