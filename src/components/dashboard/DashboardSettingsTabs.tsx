"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  SETTINGS_TABS,
  type SettingsTabId,
} from "@/lib/dashboard-settings-tabs";
import { cn } from "@/lib/utils";

export type { SettingsTabId };
export { SETTINGS_TABS, parseSettingsTab } from "@/lib/dashboard-settings-tabs";

type Props = {
  active: SettingsTabId;
  children: React.ReactNode;
};

export function DashboardSettingsTabs({ active, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Owner.settings");

  function setTab(tab: SettingsTabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/settings?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <nav
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-px"
        aria-label={t("tabsAriaLabel")}
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
            {t(tab.labelKey)}
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
