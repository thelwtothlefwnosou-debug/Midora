"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { useTranslations } from "next-intl";

import {

  ACCOUNT_NAV_BOTTOM,

  getAccountNavGroups,

  DASHBOARD_HELP_HREF,

  type AccountNavId,

  type AccountNavItem,

} from "@/components/account/account-nav";

import { useDashboardLayout } from "@/components/dashboard/DashboardLayoutProvider";

import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";

import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";

import { cn } from "@/lib/utils";

import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";



const PATH_MATCH: Partial<Record<AccountNavId, (path: string) => boolean>> = {

  overview: (path) => path === "/dashboard",

  listings: (path) =>

    path === "/dashboard/listings" ||

    (path.startsWith("/dashboard/listings/") && !path.startsWith("/dashboard/listings/new")),

  "new-listing": (path) => path.startsWith("/dashboard/listings/new"),

  requests: (path) => path.startsWith("/dashboard/requests"),

  messages: (path) => path.startsWith("/dashboard/messages"),

  profile: (path) => path.startsWith("/dashboard/profile"),

  verification: (path) => path.startsWith("/dashboard/verification"),

  subscription: (path) => path.startsWith("/dashboard/subscription"),

  favorites: (path) => path.startsWith("/dashboard/favorites"),

  settings: (path) => path.startsWith("/dashboard/settings"),

  admin: (path) => path.startsWith("/admin"),

};



export function AccountNav({

  active,

  isAdmin,

  compact = false,

  collapsed = false,

}: {

  active: AccountNavId;

  isAdmin?: boolean;

  compact?: boolean;

  collapsed?: boolean;

}) {

  const t = useTranslations("AccountNav");

  const pathname = usePathname();

  const ctx = useDashboardLayout();

  const newLeadsCount = ctx?.newLeadsCount ?? 0;



  function badgeForItem(item: AccountNavItem): number {

    if (item.id === "requests") return newLeadsCount;

    return 0;

  }



  function renderItem(item: AccountNavItem) {

    if (item.adminOnly && !isAdmin) return null;

    const matchFn = PATH_MATCH[item.id];

    const isActive = active === item.id || (matchFn?.(pathname) ?? false);

    const badge = badgeForItem(item);

    const label = t(item.labelKey);



    const linkClass = cn(

      "relative flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors",

      compact ? "shrink-0 whitespace-nowrap px-3 py-2.5" : "px-2.5 py-2 text-[13px]",

      collapsed && !compact && "justify-center px-2",

      isActive

        ? "bg-charcoal text-white shadow-soft"

        : "text-charcoal/70 hover:bg-sand hover:text-charcoal"

    );



    const linkBody = (

      <>

        {isActive && !collapsed && (

          <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold" />

        )}

        <item.icon className={cn("shrink-0", compact ? "h-4 w-4" : "h-3.5 w-3.5")} />

        {!collapsed && <span className="truncate">{label}</span>}

        {!collapsed && badge > 0 && (

          <span

            className={cn(

              "ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",

              isActive ? "bg-gold text-charcoal" : "bg-gold/15 text-gold-dark"

            )}

          >

            {badge > 99 ? "99+" : badge}

          </span>

        )}

      </>

    );



    if (item.id === "listings") {

      return (

        <OwnerListingsNavLink

          key={item.id}

          href={OWNER_LISTINGS_LIST_PATH}

          title={collapsed ? label : undefined}

          className={linkClass}

        >

          {linkBody}

        </OwnerListingsNavLink>

      );

    }



    return (

      <Link

        key={item.id}

        href={item.href}

        title={collapsed ? label : undefined}

        className={linkClass}

      >

        {linkBody}

      </Link>

    );

  }



  const groups = getAccountNavGroups();



  if (compact) {

    return (

      <nav className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">

        {groups.flatMap((g) => g.items).map(renderItem)}

      </nav>

    );

  }



  return (

    <nav className="space-y-5">

      {groups.map((group) => (

        <div key={group.titleKey}>

          {!collapsed && (

            <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">

              {t(group.titleKey)}

            </p>

          )}

          <div className="space-y-0.5">{group.items.map(renderItem)}</div>

        </div>

      ))}

      <div className={cn("border-t border-border pt-3", collapsed && "space-y-0.5")}>

        {ACCOUNT_NAV_BOTTOM.map(renderItem)}

        {!collapsed && (

          <Link

            href={DASHBOARD_HELP_HREF}

            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-charcoal/70 hover:bg-sand"

          >

            <HelpCircle className="h-3.5 w-3.5 shrink-0" />

            {t("help")}

          </Link>

        )}

      </div>

    </nav>

  );

}



export function AccountNavCollapseButton({

  collapsed,

  onToggle,

}: {

  collapsed: boolean;

  onToggle: () => void;

}) {

  const t = useTranslations("AccountNav");



  return (

    <button

      type="button"

      onClick={onToggle}

      className="hidden lg:flex w-full items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-[11px] text-muted hover:bg-sand"

      aria-label={collapsed ? t("ariaExpandSidebar") : t("ariaCollapseSidebar")}

    >

      {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}

      {!collapsed && t("collapse")}

    </button>

  );

}


