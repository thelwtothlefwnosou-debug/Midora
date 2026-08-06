"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ExternalLink, Plus } from "lucide-react";
import type { AppNotification } from "@/lib/notifications/types";
import type { Profile } from "@/lib/types";
import { dashboardBreadcrumbKey, type AccountNavId } from "@/components/account/account-nav";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { signOut } from "@/lib/actions";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";
import { OWNER_LISTINGS_LIST_PATH, isOwnerListingWorkspacePath } from "@/lib/owner-listings-nav";

export function DashboardHeader({
  profile,
  email,
  active,
  avatarUrl,
  notifications,
  unreadCount,
}: {
  profile: Profile;
  email: string;
  active: AccountNavId;
  avatarUrl?: string | null;
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const tAccount = useTranslations("AccountNav");
  const tHeader = useTranslations("Owner.dashboardHeader");
  const pathname = usePathname();
  const inListingWorkspace = isOwnerListingWorkspacePath(pathname ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profileLinks = [
    { href: "/dashboard/profile", label: tHeader("profileLink") },
    { href: "/dashboard/verification", label: tHeader("verificationLink") },
    { href: "/dashboard/settings?tab=notifications", label: tHeader("notificationsLink") },
    { href: "/dashboard/settings?tab=security", label: tHeader("securityLink") },
  ];

  const breadcrumb = tAccount(dashboardBreadcrumbKey(pathname, active));

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[min(100%,1480px)] items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <MidoraLogo href="/" variant="default" size="sm" className="shrink-0" />
          <span className="hidden text-muted sm:inline">/</span>
          {inListingWorkspace ? (
            <OwnerListingsNavLink
              href={OWNER_LISTINGS_LIST_PATH}
              className="hidden truncate text-sm text-muted transition-colors hover:text-charcoal sm:inline"
            >
              {tHeader("myListings")}
            </OwnerListingsNavLink>
          ) : (
            <span className="hidden truncate text-sm text-muted sm:inline">{breadcrumb}</span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:bg-sand sm:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {tHeader("viewSite")}
          </Link>

          <NotificationCenter
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />

          <Link
            href={OWNER_LISTING_NEW_PATH}
            className="inline-flex items-center gap-1 rounded-lg bg-charcoal px-3 py-1.5 text-xs font-semibold text-white hover:bg-charcoal/90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tHeader("newListing")}</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2 hover:bg-sand"
            >
              <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="sm" />
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-float">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium text-charcoal">
                    {profile.full_name || tHeader("userFallback")}
                  </p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
                {profileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-sm text-charcoal hover:bg-sand"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {profile.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 text-sm text-charcoal hover:bg-sand"
                    onClick={() => setMenuOpen(false)}
                  >
                    {tAccount("admin")}
                  </Link>
                )}
                <form action={signOut} className="border-t border-border">
                  <button
                    type="submit"
                    className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-sand"
                  >
                    {tHeader("signOut")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
