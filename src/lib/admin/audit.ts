import { createServiceClient } from "@/lib/supabase/service";

export type AdminAuditAction =
  | "listing_opened_for_review"
  | "listing_approved"
  | "listing_rejected"
  | "listing_needs_changes"
  | "listing_changes_requested"
  | "listing_hidden"
  | "listing_restored"
  | "registry_reviewed"
  | "listing_location_approved"
  | "listing_location_updated"
  | "user_role_changed"
  | "user_suspended"
  | "user_unsuspended"
  | "avatar_hidden_by_admin"
  | "avatar_removed_by_admin"
  | "avatar_uploaded"
  | "avatar_removed"
  | "report_resolved"
  | "report_dismissed"
  | "report_reviewing"
  | "bug_report_fixed"
  | "verification_approved"
  | "verification_rejected"
  | "unavailable_period_deleted"
  | "subscription_updated"
  | "admin_setting_updated"
  | "lead_archived"
  | "lead_marked_read";

export async function logAdminAudit(
  adminUserId: string,
  action: AdminAuditAction,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  const db = createServiceClient();
  if (!db) return;
  await db.from("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: metadata ?? null,
  });
}

export async function logAppEvent(
  eventType: string,
  options?: {
    userId?: string | null;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const db = createServiceClient();
  if (!db) return;
  await db.from("app_events").insert({
    user_id: options?.userId ?? null,
    event_type: eventType,
    entity_type: options?.entityType ?? null,
    entity_id: options?.entityId ?? null,
    metadata: options?.metadata ?? null,
  });
}
