"use client";

import { createContext, useContext, useState } from "react";
import type { AppNotification } from "@/lib/notifications/types";
import type { Profile } from "@/lib/types";

type DashboardLayoutContextValue = {
  profile: Profile;
  email: string;
  avatarUrl: string | null;
  notifications: AppNotification[];
  unreadNotificationCount: number;
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
  unreadNotificationCount = 0,
  newLeadsCount = 0,
  children,
}: {
  profile: Profile;
  email: string;
  avatarUrl: string | null;
  notifications: AppNotification[];
  unreadNotificationCount?: number;
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
        unreadNotificationCount,
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
