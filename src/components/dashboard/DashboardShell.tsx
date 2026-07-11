"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { AccountNav, AccountNavCollapseButton } from "@/components/account/AccountNav";
import { dashboardBreadcrumb, type AccountNavId } from "@/components/account/account-nav";
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
  const ctx = useDashboardLayout();
  if (!ctx) {
    throw new Error("DashboardShell requires DashboardLayoutProvider");
  }

  const { profile, email, avatarUrl, notifications, sidebarCollapsed, setSidebarCollapsed } =
    ctx;
  const [mobileOpen, setMobileOpen] = useState(false);

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
            "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-white p-4 pt-16 transition-transform lg:static lg:translate-x-0 lg:pt-4",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            sidebarCollapsed ? "lg:w-[88px]" : "lg:w-64"
          )}
        >
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
              aria-label="Κλείσιμο"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <DashboardProfileCard
            profile={profile}
            email={email}
            avatarUrl={avatarUrl}
            collapsed={sidebarCollapsed}
          />

          <div className="mt-4 flex-1 overflow-y-auto">
            <AccountNav
              active={active}
              isAdmin={profile.role === "admin"}
              collapsed={sidebarCollapsed}
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
                {!sidebarCollapsed && "Αποσύνδεση"}
              </button>
            </form>
          </div>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-charcoal/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Κλείσιμο μενού"
          />
        )}

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:py-8">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white"
              aria-label="Μενού"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted">Dashboard / {dashboardBreadcrumb("", active)}</p>
          </div>

          <div className="mb-5 lg:mb-6">
            {active === "listings" && variant === "default" && (
              <DashboardBreadcrumbTrail
                className="mb-3"
                items={[
                  { label: "Midora", href: "/dashboard/listings" },
                  { label: "Οι αγγελίες μου" },
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
