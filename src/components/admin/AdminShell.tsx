"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, ExternalLink } from "lucide-react";
import {
  getAdminNavGroups,
  adminNavActiveWithSearch,
  type AdminNavBadgeKey,
  type AdminNavItem,
} from "@/lib/admin/nav";
import { profileInitials } from "@/components/account/account-nav";
import { signOut } from "@/lib/actions";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { cn } from "@/lib/utils";

type Props = {
  profileName: string;
  email: string;
  children: React.ReactNode;
  navBadges?: Partial<Record<AdminNavBadgeKey, number>>;
};

const BADGE_KEYS: Partial<Record<AdminNavItem["id"], AdminNavBadgeKey>> = {
  review: "review",
  "listing-reports": "listing-reports",
  verifications: "verifications",
  "bug-reports": "bug-reports",
};

export function AdminShell({ profileName, email, children, navBadges }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = profileInitials(profileName, email);

  function isActive(item: AdminNavItem) {
    return adminNavActiveWithSearch(pathname, searchParams, item);
  }

  const navGroups = getAdminNavGroups();

  const sidebar = (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item);
              const badgeKey = BADGE_KEYS[item.id];
              const badgeCount = badgeKey ? navBadges?.[badgeKey] : undefined;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold/15 text-charcoal"
                      : "text-charcoal/70 hover:bg-sand/80 hover:text-charcoal"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-gold")} />
                  <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                  {badgeCount != null && badgeCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-border p-2 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Μενού"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <MidoraLogo
              href="/admin"
              variant="default"
              size="md"
              suffix={<span className="text-gold-dark"> Admin</span>}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-xs font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium text-charcoal">{profileName}</p>
                <p className="truncate text-xs text-muted">{email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="hidden items-center gap-1 text-sm text-muted hover:text-gold sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Πίσω στο site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:bg-sand"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Έξοδος</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px] gap-0 lg:gap-8">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-72 overflow-y-auto border-r border-border bg-white p-4 pt-16 transition-transform lg:static lg:block lg:max-h-[calc(100dvh-3.5rem)] lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:pt-6 lg:pb-8",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebar}
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-charcoal/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Κλείσιμο"
          />
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
