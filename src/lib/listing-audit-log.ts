import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingAuditActorRole } from "@/lib/types";

export type AuditLogInput = {
  listingId: string;
  actorUserId: string;
  actorRole: ListingAuditActorRole;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logListingAudit(
  supabase: SupabaseClient,
  input: AuditLogInput
): Promise<void> {
  const { error } = await supabase.from("listing_audit_logs").insert({
    listing_id: input.listingId,
    actor_user_id: input.actorUserId,
    actor_role: input.actorRole,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[listing-audit]", error.message);
  }
}
