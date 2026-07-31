"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Home, MessageCircle, Search, UserRound } from "lucide-react";
import { buildAuthRedirectUrl } from "@/lib/owner-flow";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { setMobileBottomNavScrollHidden } from "@/lib/mobile-bottom-nav-chrome";
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

const SCROLL_DOWN_THRESHOLD = 12;
const SCROLL_UP_THRESHOLD = 8;
const TOP_ALWAYS_VISIBLE = 48;

/**
 * Fixed bottom nav for phone (≤639px). Mounted once from the root layout.
 * Visibility gated with CSS max-width: 639px (never shows from 640px up).
 * Scroll: hide on down, show on up / near top — transform only (no layout shift).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("Nav");
  const tSearch = useTranslations("Search");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const lastYRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const hiddenRef = useRef(false);

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

  useEffect(() => {
    hiddenRef.current = false;
    setMobileBottomNavScrollHidden(false);
    lastYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
  }, [pathname]);

  useEffect(() => {
    if (!shouldShowMobileBottomNav(pathname)) {
      setMobileBottomNavScrollHidden(false);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onScroll() {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const y = window.scrollY;
        const delta = y - lastYRef.current;

        if (y <= TOP_ALWAYS_VISIBLE) {
          if (hiddenRef.current) {
            hiddenRef.current = false;
            setMobileBottomNavScrollHidden(false);
          }
          lastYRef.current = y;
          return;
        }

        if (reduceMotion) {
          lastYRef.current = y;
          return;
        }

        if (delta > SCROLL_DOWN_THRESHOLD && !hiddenRef.current) {
          hiddenRef.current = true;
          setMobileBottomNavScrollHidden(true);
        } else if (delta < -SCROLL_UP_THRESHOLD && hiddenRef.current) {
          hiddenRef.current = false;
          setMobileBottomNavScrollHidden(false);
        }

        lastYRef.current = y;
      });
    }

    lastYRef.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setMobileBottomNavScrollHidden(false);
    };
  }, [pathname]);

  const profileLabel = locale === "en" ? "Profile" : "Προφίλ";

  const labels: Record<(typeof ITEMS)[number]["labelKey"], string> = {
    search: tSearch("search"),
    favorites: tNav("favorites"),
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
