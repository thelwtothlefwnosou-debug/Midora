import { createClient } from "@/lib/supabase/server";
import type {
  AppNotification,
  NotificationBodyParams,
  NotificationMessageKey,
  NotificationType,
} from "@/lib/notifications/types";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title_key: string;
  body_key: string | null;
  body_params: NotificationBodyParams | null;
  entity_type: string | null;
  entity_id: string | null;
  href: string;
  dedupe_key: string;
  read_at: string | null;
  created_at: string;
};

function isMissingTableError(message: string | undefined): boolean {
  const msg = message ?? "";
  return (
    msg.includes("user_notifications") &&
    (msg.includes("does not exist") ||
      msg.includes("Could not find") ||
      msg.includes("schema cache") ||
      msg.includes("42P01"))
  );
}

function mapRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    titleKey: row.title_key as NotificationMessageKey,
    bodyKey: (row.body_key as NotificationMessageKey | null) ?? null,
    bodyParams: row.body_params ?? {},
    entityType: row.entity_type,
    entityId: row.entity_id,
    href: row.href,
    dedupeKey: row.dedupe_key,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listUserNotifications(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<AppNotification[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
  const offset = Math.max(options?.offset ?? 0, 0);

  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      "id, user_id, type, title_key, body_key, body_params, entity_type, entity_id, href, dedupe_key, read_at, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    if (isMissingTableError(error.message)) return [];
    console.error("[notifications] list", error.message);
    return [];
  }

  return ((data ?? []) as NotificationRow[]).map(mapRow);
}

export async function countUnreadUserNotifications(
  userId: string
): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    if (isMissingTableError(error.message)) return 0;
    console.error("[notifications] unread count", error.message);
    return 0;
  }

  return count ?? 0;
}
