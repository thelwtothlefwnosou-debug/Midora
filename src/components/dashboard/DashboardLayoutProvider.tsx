"use client";

import { createContext, useContext, useState } from "react";
import type { OwnerNotification } from "@/lib/owner-dashboard";
import type { Profile } from "@/lib/types";

type DashboardLayoutContextValue = {
  profile: Profile;
  email: string;
  avatarUrl: string | null;
  notifications: OwnerNotification[];
  newLeadsCount: number;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
};

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null);

export function DashboardLayoutProvider({
  profile,
  email,
  avatarUrl,
  notifications,
  newLeadsCount = 0,
  children,
}: {
  profile: Profile;
  email: string;
  avatarUrl: string | null;
  notifications: OwnerNotification[];
  newLeadsCount?: number;
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardLayoutContext.Provider
      value={{
        profile,
        email,
        avatarUrl,
        notifications,
        newLeadsCount,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  return useContext(DashboardLayoutContext);
}
