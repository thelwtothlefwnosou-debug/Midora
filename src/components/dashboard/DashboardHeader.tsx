"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Bell, ChevronDown, ExternalLink, Plus } from "lucide-react";
import type { OwnerNotification } from "@/lib/owner-dashboard";
import type { Profile } from "@/lib/types";
import { dashboardBreadcrumb, type AccountNavId } from "@/components/account/account-nav";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { signOut } from "@/lib/actions";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { isPreviewV80 } from "@/lib/preview-v80";
import {
  getReadNotificationIds,
  markNotificationsRead,
} from "@/lib/preview-v80-notifications";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  profile,
  email,
  active,
  avatarUrl,
  notifications,
}: {
  profile: Profile;
  email: string;
  active: AccountNavId;
  avatarUrl?: string | null;
  notifications: OwnerNotification[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPreviewV80) setReadIds(getReadNotificationIds());
  }, []);

  const displayNotifications = isPreviewV80
    ? notifications.map((n) => ({ ...n, read: n.read || readIds.has(n.id) }))
    : notifications;
  const unread = displayNotifications.filter((n) => !n.read).length;
  const breadcrumb = dashboardBreadcrumb(pathname, active);

  function openBell() {
    setBellOpen((v) => {
      const next = !v;
      if (next && isPreviewV80) {
        const unreadIds = displayNotifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length) {
          markNotificationsRead(unreadIds);
          setReadIds((prev) => new Set([...prev, ...unreadIds]));
        }
      }
      return next;
    });
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[min(100%,1480px)] items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <MidoraLogo href="/dashboard" variant="default" size="sm" className="shrink-0" />
          <span className="hidden text-muted sm:inline">/</span>
          <span className="hidden truncate text-sm text-muted sm:inline">{breadcrumb}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:bg-sand sm:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Προβολή site
          </Link>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={openBell}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-sand"
              aria-label="Ειδοποιήσεις"
            >
              <Bell className="h-4 w-4 text-charcoal/70" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-border bg-white shadow-float">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="font-display text-sm font-semibold text-charcoal">Ειδοποιήσεις</p>
                  <Link
                    href="/dashboard/requests"
                    className="text-xs text-gold hover:underline"
                    onClick={() => setBellOpen(false)}
                  >
                    Δες όλες
                  </Link>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {displayNotifications.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-muted">
                      Δεν έχεις νέες ειδοποιήσεις.
                    </li>
                  ) : (
                    displayNotifications.slice(0, 8).map((n) => (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setBellOpen(false)}
                          className={cn(
                            "block border-b border-border px-4 py-3 hover:bg-sand/40",
                            !n.read && "bg-gold/5"
                          )}
                        >
                          <p className="text-sm font-medium text-charcoal">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <Link
            href={OWNER_LISTING_NEW_PATH}
            className={cn(
              "items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-dark",
              isPreviewV80 ? "inline-flex" : "hidden sm:inline-flex"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Ανέβασε αγγελία
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2 hover:bg-sand"
            >
              <ProfileAvatar
                profile={{ ...profile, email }}
                imageUrl={avatarUrl}
                size="sm"
              />
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-float">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium text-charcoal">
                    {profile.full_name || "Χρήστης"}
                  </p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="block px-3 py-2 text-sm text-charcoal hover:bg-sand"
                  onClick={() => setMenuOpen(false)}
                >
                  Ρυθμίσεις
                </Link>
                <Link
                  href="/dashboard/settings/profile"
                  className="block px-3 py-2 text-sm text-charcoal hover:bg-sand"
                  onClick={() => setMenuOpen(false)}
                >
                  Φωτογραφία προφίλ
                </Link>
                {profile.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 text-sm text-charcoal hover:bg-sand"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <form action={signOut} className="border-t border-border">
                  <button
                    type="submit"
                    className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-sand"
                  >
                    Αποσύνδεση
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
