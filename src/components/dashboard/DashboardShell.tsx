"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useDashboardLayout } from "@/components/dashboard/DashboardLayoutProvider";
import type { AccountNavId } from "@/components/account/account-nav";

export function DashboardShell({
  active: _active,
  title,
  subtitle,
  children,
}: {
  active: AccountNavId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const ctx = useDashboardLayout();
  if (!ctx) {
    throw new Error("DashboardShell requires DashboardLayoutProvider");
  }

  const { profile, email, avatarUrl, notifications } = ctx;

  return (
    <div className="min-h-screen bg-cream">
      <DashboardHeader
        profile={profile}
        email={email}
        avatarUrl={avatarUrl}
        notifications={notifications}
      />

      <main className="mx-auto w-full max-w-[1360px] px-3 py-4 sm:px-5 lg:py-6">
        <div className="mb-4">
          <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
