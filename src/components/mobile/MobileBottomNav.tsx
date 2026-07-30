"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Home, MessageCircle, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    id: "search",
    href: "/listings?rentalType=short_term",
    match: (path: string) => path === "/listings",
    icon: Search,
    labelKey: "search" as const,
  },
  {
    id: "favorites",
    href: "/dashboard/favorites",
    match: (path: string) => path.startsWith("/dashboard/favorites"),
    icon: Heart,
    labelKey: "favorites" as const,
  },
  {
    id: "myListings",
    href: "/dashboard/listings",
    match: (path: string) =>
      path === "/dashboard/listings" ||
      (path.startsWith("/dashboard/listings/") && !path.includes("/messages")),
    icon: Home,
    labelKey: "myListings" as const,
  },
  {
    id: "messages",
    href: "/dashboard/messages",
    match: (path: string) => path.startsWith("/dashboard/messages"),
    icon: MessageCircle,
    labelKey: "messages" as const,
  },
  {
    id: "profile",
    href: "/dashboard/profile",
    match: (path: string) =>
      path.startsWith("/dashboard/profile") || path.startsWith("/dashboard/settings"),
    icon: UserRound,
    labelKey: "profile" as const,
  },
] as const;

/**
 * Fixed bottom nav for public home + listings only.
 * Visibility gated with CSS max-width: 639px (never shows from 640px up).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("Nav");
  const tSearch = useTranslations("Search");

  // AccountNav is omitted from the public client message bundle — keep profile label local.
  const profileLabel = locale === "en" ? "Profile" : "Προφίλ";

  const labels: Record<(typeof ITEMS)[number]["labelKey"], string> = {
    search: tSearch("search"),
    favorites: tNav("favorites"),
    // Short label so it fits 360–440 without ellipsis; route stays /dashboard/listings.
    myListings: tNav("listings"),
    messages: tNav("messages"),
    profile: profileLabel,
  };

  return (
    <nav className="midora-msearch-bottom-nav" aria-label={tNav("ariaMain")}>
      <ul className="midora-msearch-bottom-nav__list">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <li key={item.id} className="midora-msearch-bottom-nav__item">
              <Link
                href={item.href}
                className={cn(
                  "midora-msearch-bottom-nav__link",
                  active && "midora-msearch-bottom-nav__link--active"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="midora-msearch-bottom-nav__icon" strokeWidth={1.75} aria-hidden />
                <span className="midora-msearch-bottom-nav__label">{labels[item.labelKey]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
