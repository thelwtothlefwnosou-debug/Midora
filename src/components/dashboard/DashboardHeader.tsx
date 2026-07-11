"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Bell, ChevronDown, ExternalLink, Menu, Plus, X } from "lucide-react";
import type { OwnerNotification } from "@/lib/owner-dashboard";
import type { Profile } from "@/lib/types";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { signOut } from "@/lib/actions";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { OwnerTopNav } from "@/components/dashboard/OwnerTopNav";
import { isPreviewV80 } from "@/lib/preview-v80";
import {
  getReadNotificationIds,
  markNotificationsRead,
} from "@/lib/preview-v80-notifications";
import { cn } from "@/lib/utils";

const PROFILE_LINKS = [
  { href: "/dashboard/settings/profile", label: "Προφίλ" },
  { href: "/dashboard/verification", label: "Επαλήθευση" },
  { href: "/dashboard/settings?tab=notifications", label: "Ειδοποιήσεις" },
  { href: "/dashboard/settings?tab=security", label: "Ασφάλεια και απόρρητο" },
];

export function DashboardHeader({
  profile,
  email,
  avatarUrl,
  notifications,
}: {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  notifications: OwnerNotification[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPreviewV80) setReadIds(getReadNotificationIds());
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const displayNotifications = isPreviewV80
    ? notifications.map((n) => ({ ...n, read: n.read || readIds.has(n.id) }))
    : notifications;
  const unread = displayNotifications.filter((n) => !n.read).length;

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
      <div className="mx-auto max-w-[1360px] px-3 sm:px-5">
        <div className="flex h-12 items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border lg:hidden"
              aria-label="Μενού"
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <MidoraLogo href="/dashboard" variant="default" size="sm" className="shrink-0" />
            <OwnerTopNav className="hidden lg:flex" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:bg-sand xl:inline-flex"
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
                  <div className="border-b border-border px-4 py-3">
                    <p className="font-display text-sm font-semibold text-charcoal">Ειδοποιήσεις</p>
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
              className="inline-flex items-center gap-1 rounded-lg bg-charcoal px-3 py-1.5 text-xs font-semibold text-white hover:bg-charcoal/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Νέα αγγελία</span>
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
                      {profile.full_name || "Χρήστης"}
                    </p>
                    <p className="truncate text-xs text-muted">{email}</p>
                  </div>
                  {PROFILE_LINKS.map((link) => (
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
                      Διαχείριση
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

        {mobileNavOpen && (
          <div className="border-t border-border py-3 lg:hidden">
            <OwnerTopNav />
            <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
              {PROFILE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm text-charcoal/80 hover:bg-sand"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
