"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, LogOut, Home, Search, LayoutDashboard } from "lucide-react";
import { AccountNav, AccountNavCollapseButton } from "@/components/account/AccountNav";
import { dashboardBreadcrumbKey, type AccountNavId } from "@/components/account/account-nav";
import { DashboardBreadcrumbTrail } from "@/components/dashboard/DashboardBreadcrumbTrail";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardProfileCard } from "@/components/dashboard/DashboardProfileCard";
import { useDashboardLayout } from "@/components/dashboard/DashboardLayoutProvider";
import { signOut } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function DashboardShell({
  active,
  title,
  subtitle,
  variant = "default",
  children,
}: {
  active: AccountNavId;
  title: string;
  subtitle?: string;
  variant?: "default" | "workspace";
  children: React.ReactNode;
}) {
  const tAccount = useTranslations("AccountNav");
  const tShell = useTranslations("Dashboard.shell");
  const tDash = useTranslations("Dashboard");
  const pathname = usePathname();
  const ctx = useDashboardLayout();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  if (!ctx) {
    // Never blank the whole dashboard — show a recoverable shell instead of throwing.
    return (
      <div className="min-h-screen bg-cream px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-6 text-center shadow-soft">
          <p className="font-display text-lg font-semibold text-charcoal">
            {tShell("notLoadedTitle")}
          </p>
          <p className="mt-2 text-sm text-muted">{tShell("notLoadedBody")}</p>
          <a
            href="/dashboard"
            className="mt-4 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white"
          >
            {tShell("refresh")}
          </a>
        </div>
        {children}
      </div>
    );
  }

  const { profile, email, avatarUrl, notifications, sidebarCollapsed, setSidebarCollapsed } =
    ctx;

  const publicLinkClass =
    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-charcoal/70 hover:bg-sand hover:text-charcoal";
  const overviewActive =
    active === "overview" || pathname === "/dashboard" || pathname === "/dashboard/";

  return (
    <div className="min-h-screen bg-cream">
      <DashboardHeader
        profile={profile}
        email={email}
        active={active}
        avatarUrl={avatarUrl}
        notifications={notifications}
      />

      <div className="mx-auto flex w-full max-w-[min(100%,1480px)]">
        <aside
          className={cn(
            // z-[60] above Help FAB (z-40); help panel (z-120) still wins when open
            // overflow-x-hidden: clip long names so closed off-canvas drawer cannot bleed into the page
            "fixed inset-y-0 left-0 z-[60] flex w-[min(100vw-3rem,17rem)] flex-col overflow-x-hidden border-r border-border/80 bg-white/95 p-3 pt-[max(4rem,calc(3.5rem+env(safe-area-inset-top,0px)))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] backdrop-blur-sm transition-transform lg:static lg:z-30 lg:translate-x-0 lg:overflow-x-visible lg:pt-3 lg:pb-3 lg:pl-3",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            // When closed on phone, also hide paint + hits so nothing can peek into the page
            !mobileOpen && "max-lg:invisible max-lg:pointer-events-none",
            sidebarCollapsed ? "lg:w-[4.5rem]" : "lg:w-52",
            variant === "workspace" && "lg:border-border/60"
          )}
        >
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={closeMobile}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
              aria-label={tShell("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <DashboardProfileCard
            profile={profile}
            email={email}
            avatarUrl={avatarUrl}
            collapsed={sidebarCollapsed}
            compact={variant === "workspace"}
          />

          <div className="mt-4 flex-1 overflow-y-auto">
            {/* Public exits — mobile drawer only; desktop sidebar unchanged */}
            <nav
              className="mb-4 space-y-0.5 border-b border-border pb-4 lg:hidden"
              aria-label={tShell("publicNav")}
            >
              <Link href="/" onClick={closeMobile} className={publicLinkClass}>
                <Home className="h-3.5 w-3.5 shrink-0" />
                <span>{tShell("navHome")}</span>
              </Link>
              <Link href="/listings" onClick={closeMobile} className={publicLinkClass}>
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span>{tShell("navSearch")}</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={closeMobile}
                className={cn(
                  publicLinkClass,
                  overviewActive &&
                    "bg-charcoal text-white shadow-soft hover:bg-charcoal hover:text-white"
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                <span>{tAccount("overview")}</span>
              </Link>
            </nav>

            <AccountNav
              active={active}
              isAdmin={profile.role === "admin"}
              collapsed={sidebarCollapsed}
              onNavigate={closeMobile}
            />
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <AccountNavCollapseButton
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <form action={signOut}>
              <button
                type="submit"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-charcoal/70 hover:bg-sand",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                {!sidebarCollapsed && tDash("signOut")}
              </button>
            </form>
          </div>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-charcoal/30 lg:hidden"
            onClick={closeMobile}
            aria-label={tShell("closeMenu")}
          />
        )}

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 lg:py-6">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white"
              aria-label={tShell("menu")}
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted">
              Dashboard / {tAccount(dashboardBreadcrumbKey("", active))}
            </p>
          </div>

          <div className="mb-5 lg:mb-6">
            {active === "listings" && variant === "default" && (
              <DashboardBreadcrumbTrail
                className="mb-3"
                items={[
                  { label: "Midora", href: "/" },
                  { label: tDash("myListings") },
                ]}
              />
            )}
            {variant !== "workspace" && (
              <>
                <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">{title}</h1>
                {subtitle && (
                  <p className="mt-1.5 text-sm text-muted sm:mt-2 sm:text-base">{subtitle}</p>
                )}
              </>
            )}
            {variant === "workspace" && subtitle && (
              <p className="sr-only">{subtitle}</p>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
