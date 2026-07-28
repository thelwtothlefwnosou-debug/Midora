"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Home,
  Plus,
  Inbox,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { resolveMenuDisplayName } from "@/lib/auth-profile-name";
import { signOut } from "@/lib/actions";
import { profileInitials } from "@/components/account/account-nav";
import { cn } from "@/lib/utils";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { BugReportMenuItem } from "@/components/feedback/BugReportMenuItem";

type MenuLink = {
  href: string;
  labelKey:
    | "overview"
    | "profile"
    | "listings"
    | "newListing"
    | "requests"
    | "messages"
    | "favorites"
    | "settings";
  icon: LucideIcon;
};

const MENU_LINKS: MenuLink[] = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", labelKey: "profile", icon: UserIcon },
  { href: "/dashboard/listings", labelKey: "listings", icon: Home },
  { href: OWNER_LISTING_NEW_PATH, labelKey: "newListing", icon: Plus },
  { href: "/dashboard/requests", labelKey: "requests", icon: Inbox },
  { href: "/dashboard/messages", labelKey: "messages", icon: MessageSquare },
  { href: "/dashboard/favorites", labelKey: "favorites", icon: Heart },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

const MENU_WIDTH = 288;

export function UserMenu({ user, compact = false }: { user: User; compact?: boolean }) {
  const tAccount = useTranslations("AccountNav");
  const tDash = useTranslations("Dashboard");
  const locale = useLocale();
  const authNameInput = {
    email: user.email,
    userMetadata: user.user_metadata,
    identities: user.identities,
  } as const;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState(() =>
    resolveMenuDisplayName({ auth: authNameInput, locale })
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const email = user.email ?? "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("full_name, display_name, role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(
          resolveMenuDisplayName({
            profileFullName: data?.full_name,
            profileDisplayName: data?.display_name,
            auth: authNameInput,
            locale,
          })
        );
        if (data?.role === "admin") setIsAdmin(true);
      });
  }, [user.email, user.id, user.identities, user.user_metadata, locale]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuStyle({ visibility: "hidden" });
      return;
    }

    function updatePosition() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const margin = 8;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const maxHeight = Math.min(480, spaceBelow - margin);
      const openUpward = maxHeight < 280 && rect.top > window.innerHeight / 2;

      setMenuStyle({
        position: "fixed",
        top: openUpward ? undefined : rect.bottom + margin,
        bottom: openUpward ? window.innerHeight - rect.top + margin : undefined,
        right: Math.max(margin, window.innerWidth - rect.right),
        width: MENU_WIDTH,
        maxHeight: openUpward
          ? Math.min(480, rect.top - margin * 2)
          : Math.max(200, maxHeight),
        zIndex: 9999,
        visibility: "visible",
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      const portal = document.getElementById("user-menu-portal");
      if (portal?.contains(target)) return;
      setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const initials = profileInitials(fullName, email);

  const menuPanel = open ? (
    <div
      id="user-menu-portal"
      style={menuStyle}
      className="overflow-hidden overflow-y-auto rounded-2xl border border-border bg-white py-2 shadow-card"
      role="menu"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="truncate font-semibold text-charcoal">{fullName}</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>

      <div className="py-1">
        {MENU_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal/80 hover:bg-sand"
            role="menuitem"
          >
            <link.icon className="h-4 w-4 text-gold" />
            {tAccount(link.labelKey)}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal/80 hover:bg-sand"
            role="menuitem"
          >
            <Shield className="h-4 w-4 text-gold" />
            {tAccount("admin")}
          </Link>
        )}
        <div className="px-4 py-2">
          <BugReportMenuItem onOpen={() => setOpen(false)} />
        </div>
      </div>

      <div className="border-t border-border pt-1">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-charcoal/80 hover:bg-sand"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            {tDash("signOut")}
          </button>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border bg-white transition-shadow hover:shadow-card",
          compact
            ? "border-charcoal/10 py-0.5 pr-1.5 pl-0.5 shadow-none hover:border-charcoal/15"
            : "border-border py-1.5 pr-2 pl-1.5 shadow-soft",
          open && "ring-2 ring-gold/20"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-charcoal font-semibold text-white",
            compact ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs"
          )}
        >
          {initials}
        </span>
        <span
          className={cn(
            "hidden truncate font-medium text-charcoal sm:inline",
            compact ? "max-w-[88px] text-xs" : "max-w-[120px] text-sm"
          )}
        >
          {fullName}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {mounted && menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}
