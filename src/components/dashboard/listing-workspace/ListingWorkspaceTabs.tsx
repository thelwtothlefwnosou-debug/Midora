"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LISTING_WORKSPACE_TABS,
  resolveListingWorkspaceTab,
} from "@/lib/listing-workspace-nav";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
};

export function ListingWorkspaceTabs({ listingId }: Props) {
  const pathname = usePathname() ?? "";
  const active = resolveListingWorkspaceTab(pathname, listingId);

  return (
    <nav
      className="sticky top-0 z-20 -mx-3 mb-6 border-b border-border bg-cream/95 px-3 backdrop-blur-sm sm:-mx-5 sm:px-5"
      aria-label="Διαχείριση αγγελίας"
    >
      <div className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LISTING_WORKSPACE_TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href(listingId)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-gold text-charcoal"
                  : "border-transparent text-muted hover:border-charcoal/15 hover:text-charcoal"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
