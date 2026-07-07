const STORAGE_KEY = "midora-dashboard-notifications-read";

export function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function markNotificationsRead(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  const current = getReadNotificationIds();
  for (const id of ids) current.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
}
