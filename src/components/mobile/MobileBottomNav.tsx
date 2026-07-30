"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Home, MessageCircle, Search, UserRound } from "lucide-react";
import { buildAuthRedirectUrl } from "@/lib/owner-flow";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    id: "search",
    href: "/listings?rentalType=short_term",
    match: (path: string) =>
      path === "/" || path === "/listings" || path.startsWith("/listings/"),
    icon: Search,
    labelKey: "search" as const,
    authRequired: false,
  },
  {
    id: "favorites",
    href: "/dashboard/favorites",
    match: (path: string) => path.startsWith("/dashboard/favorites"),
    icon: Heart,
    labelKey: "favorites" as const,
    authRequired: true,
  },
  {
    id: "myListings",
    href: "/dashboard/listings",
    match: (path: string) =>
      path === "/dashboard/listings" ||
      (path.startsWith("/dashboard/listings/") && !path.includes("/messages")),
    icon: Home,
    labelKey: "myListings" as const,
    authRequired: true,
  },
  {
    id: "messages",
    href: "/dashboard/messages",
    match: (path: string) =>
      path.startsWith("/dashboard/messages") ||
      (path.startsWith("/dashboard/listings/") && path.includes("/messages")),
    icon: MessageCircle,
    labelKey: "messages" as const,
    authRequired: true,
  },
  {
    id: "profile",
    href: "/dashboard/profile",
    match: (path: string) =>
      path.startsWith("/dashboard/profile") || path.startsWith("/dashboard/settings"),
    icon: UserRound,
    labelKey: "profile" as const,
    authRequired: true,
  },
] as const;

/** Routes where the phone bottom nav must stay hidden. */
export function shouldShowMobileBottomNav(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/login" || pathname.startsWith("/login/")) return false;
  if (pathname === "/register" || pathname.startsWith("/register/")) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/admin")) return false;
  // Create-listing wizard: fixed footer CTAs sit at bottom — nav would cover Back/Next.
  if (
    pathname === "/dashboard/listings/new" ||
    pathname.startsWith("/dashboard/listings/new/") ||
    pathname === "/dashboard/listings/create" ||
    pathname.startsWith("/dashboard/listings/create/")
  ) {
    return false;
  }
  return true;
}

/**
 * Fixed bottom nav for phone (≤639px). Mounted once from the root layout.
 * Visibility gated with CSS max-width: 639px (never shows from 640px up).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("Nav");
  const tSearch = useTranslations("Search");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

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

  if (!shouldShowMobileBottomNav(pathname)) return null;

  return (
    <nav className="midora-msearch-bottom-nav" aria-label={tNav("ariaMain")}>
      <ul className="midora-msearch-bottom-nav__list">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const href =
            item.authRequired && signedIn === false
              ? buildAuthRedirectUrl(item.href)
              : item.href;

          return (
            <li key={item.id} className="midora-msearch-bottom-nav__item">
              <Link
                href={href}
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
