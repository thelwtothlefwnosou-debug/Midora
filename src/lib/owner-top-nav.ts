export type OwnerTopNavId = "listings" | "requests" | "messages" | "stats";

export type OwnerTopNavItem = {
  id: OwnerTopNavId;
  href: string;
};

export const OWNER_TOP_NAV: OwnerTopNavItem[] = [
  { id: "listings", href: "/dashboard/listings" },
  { id: "requests", href: "/dashboard/requests" },
  { id: "messages", href: "/dashboard/messages" },
  { id: "stats", href: "/dashboard/stats" },
];

export function resolveOwnerTopNavId(pathname: string): OwnerTopNavId | null {
  if (pathname === "/dashboard" || pathname === "/dashboard/") return null;
  if (pathname.startsWith("/dashboard/listings")) return "listings";
  if (pathname.startsWith("/dashboard/requests")) return "requests";
  if (pathname.startsWith("/dashboard/messages")) return "messages";
  if (pathname.startsWith("/dashboard/stats")) return "stats";
  return null;
}
