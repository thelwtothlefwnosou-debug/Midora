import { createServiceClient } from "@/lib/supabase/service";
import { assertSafeNotificationHref } from "@/lib/notifications/href";
import type { CreateNotificationInput } from "@/lib/notifications/types";

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

/**
 * Persist an in-app notification for a user (service role).
 * Idempotent via (user_id, dedupe_key). Never throws to callers.
 */
export async function createUserNotification(
  input: CreateNotificationInput
): Promise<{ id?: string; skipped?: boolean; error?: string }> {
  try {
    const href = assertSafeNotificationHref(input.href);
    const service = createServiceClient();
    if (!service) {
      console.warn("[notifications] No service client — skip create");
      return { skipped: true };
    }

    const row = {
      user_id: input.userId,
      type: input.type,
      title_key: input.titleKey,
      body_key: input.bodyKey ?? null,
      body_params: input.bodyParams ?? {},
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      href,
      dedupe_key: input.dedupeKey,
    };

    if (input.refreshOnConflict) {
      const { data, error } = await service
        .from("user_notifications")
        .upsert(
          {
            ...row,
            read_at: null,
            created_at: new Date().toISOString(),
          },
          { onConflict: "user_id,dedupe_key" }
        )
        .select("id")
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error.message)) {
          console.warn("[notifications] Migration not applied yet");
          return { skipped: true };
        }
        console.error("[notifications] upsert", error.message);
        return { error: error.message };
      }
      return { id: data?.id };
    }

    const { data, error } = await service
      .from("user_notifications")
      .insert(row)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        // Duplicate dedupe — intentional no-op
        return { skipped: true };
      }
      if (isMissingTableError(error.message)) {
        console.warn("[notifications] Migration not applied yet");
        return { skipped: true };
      }
      console.error("[notifications] insert", error.message);
      return { error: error.message };
    }

    return { id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notifications] create failed", message);
    return { error: message };
  }
}
