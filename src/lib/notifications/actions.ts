"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSafeNotificationHref } from "@/lib/notifications/href";
import {
  countUnreadUserNotifications,
  listUserNotifications,
} from "@/lib/notifications/queries";
import type { AppNotification } from "@/lib/notifications/types";

async function requireAuthUserId(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "unavailable" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };
  return { userId: user.id };
}

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

export async function fetchNotificationsPanel(limit = 6): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
  error?: string;
}> {
  const auth = await requireAuthUserId();
  if ("error" in auth) {
    return { notifications: [], unreadCount: 0, error: auth.error };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      listUserNotifications(auth.userId, { limit }),
      countUnreadUserNotifications(auth.userId),
    ]);
    return { notifications, unreadCount };
  } catch (err) {
    console.error("[notifications] panel fetch", err);
    return { notifications: [], unreadCount: 0, error: "fetch_failed" };
  }
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success?: true; href?: string; error?: string }> {
  const auth = await requireAuthUserId();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  if (!supabase) return { error: "unavailable" };

  const { data, error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", auth.userId)
    .select("id, href")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) return { error: "unavailable" };
    return { error: error.message };
  }
  if (!data) return { error: "not_found" };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");

  const href =
    typeof data.href === "string" && isSafeNotificationHref(data.href)
      ? data.href
      : "/dashboard";

  return { success: true, href };
}

export async function markAllNotificationsRead(): Promise<{
  success?: true;
  error?: string;
}> {
  const auth = await requireAuthUserId();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  if (!supabase) return { error: "unavailable" };

  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", auth.userId)
    .is("read_at", null);

  if (error) {
    if (isMissingTableError(error.message)) return { error: "unavailable" };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return { success: true };
}
