import {
  LayoutDashboard,
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
import { isPreviewV80 } from "@/lib/preview-v80";

export type AccountNavId =
  | "overview"
  | "listings"
  | "new-listing"
  | "requests"
  | "messages"
  | "verification"
  | "subscription"
  | "favorites"
  | "settings"
  | "admin";

export type AccountNavItem = {
  id: AccountNavId;
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type AccountNavGroup = {
  title: string;
  items: AccountNavItem[];
};

export const ACCOUNT_NAV_GROUPS: AccountNavGroup[] = [
  {
    title: "Διαχείριση αγγελιών",
    items: [
      { id: "overview", label: "Επισκόπηση", href: "/dashboard", icon: LayoutDashboard },
      { id: "listings", label: "Οι αγγελίες μου", href: "/dashboard/listings", icon: Home },
      { id: "new-listing", label: "Νέα αγγελία", href: "/dashboard/listings/new", icon: Plus },
    ],
  },
  {
    title: "Επικοινωνίες",
    items: [
      { id: "requests", label: "Αιτήματα ενδιαφέροντος", href: "/dashboard/requests", icon: Inbox },
      { id: "messages", label: "Μηνύματα", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    title: "Λογαριασμός",
    items: [
      { id: "settings", label: "Προφίλ", href: "/dashboard/settings/profile", icon: User },
      { id: "verification", label: "Επαλήθευση", href: "/dashboard/verification", icon: BadgeCheck },
      { id: "subscription", label: "Συνδρομή προβολής", href: "/dashboard/subscription", icon: CreditCard },
      { id: "favorites", label: "Αγαπημένα", href: "/dashboard/favorites", icon: Heart },
    ],
  },
];

export const ACCOUNT_NAV_BOTTOM: AccountNavItem[] = [
  { id: "admin", label: "Διαχείριση", href: "/admin", icon: Shield, adminOnly: true },
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

export function memberSinceLabel(createdAt: string): string {
  try {
    return new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric" }).format(
      new Date(createdAt)
    );
  } catch {
    return "";
  }
}

export function dashboardBreadcrumb(pathname: string, active: AccountNavId): string {
  const nav = isPreviewV80
    ? [...getAccountNavGroups().flatMap((g) => g.items), ...ACCOUNT_NAV_BOTTOM]
    : ACCOUNT_NAV;
  const item = nav.find((i) => i.id === active);
  if (item) return item.label;
  if (pathname.startsWith("/dashboard/settings")) return "Ρυθμίσεις";
  return isPreviewV80 ? "Πίνακας ελέγχου" : "Dashboard";
}
