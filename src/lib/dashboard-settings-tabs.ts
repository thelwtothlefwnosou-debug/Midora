export const SETTINGS_TABS = [
  { id: "contact", labelKey: "tabContact" },
  { id: "privacy", labelKey: "tabPrivacy" },
  { id: "security", labelKey: "tabSecurity" },
  { id: "notifications", labelKey: "tabNotifications" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

/** Safe for server + client — keep out of "use client" modules. */
export function parseSettingsTab(value: string | null | undefined): SettingsTabId {
  if (value && SETTINGS_TABS.some((t) => t.id === value)) {
    return value as SettingsTabId;
  }
  return "security";
}
