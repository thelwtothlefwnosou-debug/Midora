import {

  Home,

  Plus,

  Inbox,

  MessageSquare,

  Heart,

  Shield,

  BadgeCheck,

  CreditCard,

  User,

  type LucideIcon,

} from "lucide-react";

import type { Locale } from "@/i18n/config";

import { isPreviewV80 } from "@/lib/preview-v80";



export type AccountNavId =

  | "overview"

  | "listings"

  | "new-listing"

  | "requests"

  | "messages"

  | "profile"

  | "verification"

  | "subscription"

  | "favorites"

  | "settings"

  | "admin";



export type AccountNavLabelKey =

  | "overview"

  | "listings"

  | "newListing"

  | "requests"

  | "messages"

  | "profile"

  | "verification"

  | "settings"

  | "subscription"

  | "favorites"

  | "admin";



export type AccountNavGroupTitleKey = "groupListings" | "groupComms" | "groupAccount";



export type AccountNavBreadcrumbKey =

  | AccountNavLabelKey

  | "breadcrumbOverview"

  | "breadcrumbStats"

  | "breadcrumbProfile"

  | "breadcrumbSettings"

  | "breadcrumbDashboard";



export type AccountNavItem = {

  id: AccountNavId;

  labelKey: AccountNavLabelKey;

  href: string;

  icon: LucideIcon;

  adminOnly?: boolean;

};



export type AccountNavGroup = {

  titleKey: AccountNavGroupTitleKey;

  items: AccountNavItem[];

};



const LOCALE_TO_INTL: Record<Locale, string> = {

  el: "el-GR",

  en: "en-US",

};



export const ACCOUNT_NAV_GROUPS: AccountNavGroup[] = [

  {

    titleKey: "groupListings",

    items: [

      { id: "listings", labelKey: "listings", href: "/dashboard/listings", icon: Home },

      { id: "new-listing", labelKey: "newListing", href: "/dashboard/listings/new", icon: Plus },

    ],

  },

  {

    titleKey: "groupComms",

    items: [

      { id: "requests", labelKey: "requests", href: "/dashboard/requests", icon: Inbox },

      { id: "messages", labelKey: "messages", href: "/dashboard/messages", icon: MessageSquare },

    ],

  },

  {

    titleKey: "groupAccount",

    items: [

      { id: "profile", labelKey: "profile", href: "/dashboard/profile", icon: User },

      { id: "verification", labelKey: "verification", href: "/dashboard/verification", icon: BadgeCheck },

      { id: "settings", labelKey: "settings", href: "/dashboard/settings?tab=security", icon: Shield },

      { id: "subscription", labelKey: "subscription", href: "/dashboard/subscription", icon: CreditCard },

      { id: "favorites", labelKey: "favorites", href: "/dashboard/favorites", icon: Heart },

    ],

  },

];



export const ACCOUNT_NAV_BOTTOM: AccountNavItem[] = [

  { id: "admin", labelKey: "admin", href: "/admin", icon: Shield, adminOnly: true },

];



export function getAccountNavGroups(): AccountNavGroup[] {

  if (!isPreviewV80) return ACCOUNT_NAV_GROUPS;

  return ACCOUNT_NAV_GROUPS.map((group) => ({

    ...group,

    items: group.items.filter((item) => item.id !== "messages" && item.id !== "favorites"),

  }));

}



/** Flat list for legacy use */

export const ACCOUNT_NAV = [

  ...ACCOUNT_NAV_GROUPS.flatMap((g) => g.items),

  ...ACCOUNT_NAV_BOTTOM,

];



export const DASHBOARD_HELP_HREF = "/faq";



export function profileInitials(fullName: string, email: string): string {

  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  }

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return email.slice(0, 2).toUpperCase() || "ME";

}



export function memberSinceLabel(createdAt: string, locale: Locale): string {

  try {

    return new Intl.DateTimeFormat(LOCALE_TO_INTL[locale], { month: "long", year: "numeric" }).format(

      new Date(createdAt)

    );

  } catch {

    return "";

  }

}



export function dashboardBreadcrumbKey(pathname: string, active: AccountNavId): AccountNavBreadcrumbKey {

  const nav = isPreviewV80

    ? [...getAccountNavGroups().flatMap((g) => g.items), ...ACCOUNT_NAV_BOTTOM]

    : ACCOUNT_NAV;

  const item = nav.find((i) => i.id === active);

  if (item) return item.labelKey;

  if (pathname === "/dashboard" || pathname === "/dashboard/") {

    return "breadcrumbOverview";

  }

  if (pathname.startsWith("/dashboard/stats")) return "breadcrumbStats";

  if (pathname.startsWith("/dashboard/profile")) return "breadcrumbProfile";

  if (pathname.startsWith("/dashboard/settings")) return "breadcrumbSettings";

  return "breadcrumbDashboard";

}



/** @deprecated Use dashboardBreadcrumbKey with useTranslations("AccountNav") */

export function dashboardBreadcrumb(pathname: string, active: AccountNavId): AccountNavBreadcrumbKey {

  return dashboardBreadcrumbKey(pathname, active);

}


