import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  AlertCircle,
  Home,
  ClipboardCheck,
  RefreshCw,
  XCircle,
  CheckCircle2,
  BadgeCheck,
  FileKey,
  MapPin,
  Flag,
  Users,
  Inbox,
  MessageSquare,
  Bug,
  CalendarX,
  CreditCard,
  ScrollText,
  Settings,
} from "lucide-react";
import { isPreviewV80 } from "@/lib/preview-v80";

export type AdminNavId =
  | "overview"
  | "attention"
  | "listings"
  | "review"
  | "needs-changes"
  | "rejected"
  | "published"
  | "verifications"
  | "registry"
  | "location"
  | "listing-reports"
  | "users"
  | "interests"
  | "messages"
  | "bug-reports"
  | "availability"
  | "subscriptions"
  | "audit"
  | "settings";

export type AdminNavItem = {
  id: AdminNavId;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "Κέντρο ελέγχου",
    items: [
      { id: "overview", label: "Επισκόπηση", href: "/admin", icon: LayoutDashboard },
      {
        id: "attention",
        label: "Ενέργειες που απαιτούν προσοχή",
        href: "/admin/attention",
        icon: AlertCircle,
      },
    ],
  },
  {
    title: "Αγγελίες",
    items: [
      { id: "listings", label: "Αγγελίες", href: "/admin/listings", icon: Home },
      {
        id: "review",
        label: "Σε έλεγχο",
        href: "/admin/listings?status=pending",
        icon: ClipboardCheck,
      },
      {
        id: "needs-changes",
        label: "Χρειάζονται αλλαγές",
        href: "/admin/listings?status=needs_changes",
        icon: RefreshCw,
      },
      {
        id: "rejected",
        label: "Απορριφθείσες",
        href: "/admin/listings?status=rejected",
        icon: XCircle,
      },
      {
        id: "published",
        label: "Δημοσιευμένες",
        href: "/admin/listings?status=active",
        icon: CheckCircle2,
      },
    ],
  },
  {
    title: "Εμπιστοσύνη και έλεγχοι",
    items: [
      {
        id: "verifications",
        label: "Επαληθεύσεις αγγελιοδοτών",
        href: "/admin/verifications",
        icon: BadgeCheck,
      },
      { id: "registry", label: "ΑΜΑ / ΕΣΛ / ΜΑΓ", href: "/admin/registry", icon: FileKey },
      {
        id: "location",
        label: "Έλεγχος τοποθεσίας",
        href: "/admin/listings?filter=location",
        icon: MapPin,
      },
      {
        id: "listing-reports",
        label: "Αναφορές αγγελιών",
        href: "/admin/reports/listings",
        icon: Flag,
      },
    ],
  },
  {
    title: "Χρήστες και επικοινωνία",
    items: [
      { id: "users", label: "Χρήστες", href: "/admin/users", icon: Users },
      { id: "interests", label: "Ενδιαφέροντα", href: "/admin/interests", icon: Inbox },
      { id: "messages", label: "Μηνύματα", href: "/admin/interests?status=new", icon: MessageSquare },
      {
        id: "bug-reports",
        label: "Αναφορές προβλημάτων",
        href: "/admin/reports/bugs",
        icon: Bug,
      },
    ],
  },
  {
    title: "Λειτουργία πλατφόρμας",
    items: [
      { id: "availability", label: "Διαθεσιμότητα", href: "/admin/availability", icon: CalendarX },
      {
        id: "subscriptions",
        label: "Συνδρομές προβολής",
        href: "/admin/subscriptions",
        icon: CreditCard,
      },
      { id: "audit", label: "Audit log", href: "/admin/audit", icon: ScrollText },
      { id: "settings", label: "Ρυθμίσεις", href: "/admin/settings", icon: Settings },
    ],
  },
];

/** Flat list for backwards compatibility */
export const ADMIN_NAV = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export type AdminNavBadgeKey = "review" | "listing-reports" | "verifications" | "bug-reports";

export function getAdminNavGroups(): AdminNavGroup[] {
  if (!isPreviewV80) return ADMIN_NAV_GROUPS;
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id === "review") {
        return { ...item, href: "/admin/listings/review" };
      }
      if (item.id === "audit") {
        return { ...item, label: "Ιστορικό ενεργειών" };
      }
      return item;
    }),
  }));
}

export function adminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  const [path, query] = item.href.split("?");
  if (query) {
    return pathname === path || pathname.startsWith(path + "/");
  }
  if (path === "/admin/listings") {
    return pathname === "/admin/listings" && !item.href.includes("?");
  }
  return pathname === path || pathname.startsWith(path + "/");
}

export function adminNavActiveWithSearch(
  pathname: string,
  searchParams: URLSearchParams,
  item: AdminNavItem
): boolean {
  const [path, query] = item.href.split("?");
  if (pathname !== path && !pathname.startsWith(path + "/")) return false;
  if (!query) {
    if (path === "/admin/listings" && pathname === "/admin/listings") {
      return !searchParams.get("status") && !searchParams.get("filter");
    }
    return pathname === path || (path !== "/admin/listings" && pathname.startsWith(path + "/"));
  }
  const expected = new URLSearchParams(query);
  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) return false;
  }
  return true;
}
