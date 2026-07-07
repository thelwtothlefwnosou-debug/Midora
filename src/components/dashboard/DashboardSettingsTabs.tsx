"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export const SETTINGS_TABS = [
  { id: "profile", label: "Προφίλ" },
  { id: "contact", label: "Επικοινωνία" },
  { id: "privacy", label: "Απόρρητο" },
  { id: "security", label: "Ασφάλεια" },
  { id: "notifications", label: "Ειδοποιήσεις" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

export function parseSettingsTab(value: string | null | undefined): SettingsTabId {
  if (value && SETTINGS_TABS.some((t) => t.id === value)) {
    return value as SettingsTabId;
  }
  return "profile";
}

type Props = {
  active: SettingsTabId;
  children: React.ReactNode;
};

export function DashboardSettingsTabs({ active, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(tab: SettingsTabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/settings?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <nav
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-px"
        aria-label="Ρυθμίσεις"
      >
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-gold text-charcoal"
                : "border-transparent text-muted hover:text-charcoal"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function SettingsTabLink({
  tab,
  className,
  children,
}: {
  tab: SettingsTabId;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/dashboard/settings?tab=${tab}`} className={className}>
      {children}
    </Link>
  );
}
