import { createClient } from "@/lib/supabase/server";
import type { PropertyLeadWithListing } from "@/lib/types";

export function isLeadsTableMissingError(error: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("could not find the table") ||
    msg.includes('relation "property_leads" does not exist') ||
    msg.includes("schema cache")
  );
}

export const LEAD_ERROR_KEYS = {
  tableMissing: "leadsNotActive",
  submitFailed: "leadSubmitFailed",
} as const;

export function mapLeadError(error: { message?: string; code?: string }): string {
  if (isLeadsTableMissingError(error)) {
    return LEAD_ERROR_KEYS.tableMissing;
  }
  return error.message ?? LEAD_ERROR_KEYS.submitFailed;
}

export async function getAccessibleLeads(
  userId: string
): Promise<PropertyLeadWithListing[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: owned, error: ownedError } = await supabase
    .from("property_leads")
    .select(
      "*, listings(id, title, city, area, slug, listing_images(url, media_type, is_cover, sort_order))"
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (ownedError && !isLeadsTableMissingError(ownedError)) {
    console.error("[leads] getAccessibleLeads owned:", ownedError.message);
  }

  const { data: cohostMemberships } = await supabase
    .from("listing_cohosts")
    .select("listing_id")
    .eq("cohost_user_id", userId)
    .eq("status", "accepted")
    .eq("can_manage_messages", true);

  const cohostListingIds = (cohostMemberships ?? []).map((m) => m.listing_id as string);

  let cohostLeads: PropertyLeadWithListing[] = [];
  if (cohostListingIds.length) {
    const { data: cohostData, error: cohostError } = await supabase
      .from("property_leads")
      .select(
        "*, listings(id, title, city, area, slug, listing_images(url, media_type, is_cover, sort_order))"
      )
      .in("listing_id", cohostListingIds)
      .order("created_at", { ascending: false })
      .limit(200);

    if (cohostError && !isLeadsTableMissingError(cohostError)) {
      console.error("[leads] getAccessibleLeads cohost:", cohostError.message);
    } else {
      cohostLeads = (cohostData ?? []) as PropertyLeadWithListing[];
    }
  }

  const merged = new Map<string, PropertyLeadWithListing>();
  for (const lead of [...(owned ?? []), ...cohostLeads] as PropertyLeadWithListing[]) {
    merged.set(lead.id, lead);
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** @deprecated Use getAccessibleLeads */
export async function getOwnerLeads(
  ownerId: string
): Promise<PropertyLeadWithListing[]> {
  return getAccessibleLeads(ownerId);
}

export async function countNewOwnerLeads(ownerId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("property_leads")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "new");

  if (error) {
    if (isLeadsTableMissingError(error)) return 0;
    return 0;
  }

  return count ?? 0;
}

export async function getOwnerLeadStatsByListingIds(
  ownerId: string,
  listingIds: string[]
): Promise<Map<string, { total: number; last30Days: number; unread: number }>> {
  const stats = new Map<string, { total: number; last30Days: number; unread: number }>();
  if (!listingIds.length) return stats;

  const supabase = await createClient();
  if (!supabase) return stats;

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const { data, error } = await supabase
    .from("property_leads")
    .select("listing_id, status, created_at")
    .eq("owner_id", ownerId)
    .in("listing_id", listingIds);

  if (error) {
    if (isLeadsTableMissingError(error)) return stats;
    return stats;
  }

  for (const row of data ?? []) {
    const id = row.listing_id as string;
    const current = stats.get(id) ?? { total: 0, last30Days: 0, unread: 0 };
    current.total += 1;
    if (row.status === "new") current.unread += 1;
    if (row.created_at && new Date(row.created_at as string) >= since30) {
      current.last30Days += 1;
    }
    stats.set(id, current);
  }

  return stats;
}

export async function countLeadsByListingIds(
  ownerId: string,
  listingIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!listingIds.length) return counts;

  const supabase = await createClient();
  if (!supabase) return counts;

  const { data, error } = await supabase
    .from("property_leads")
    .select("listing_id")
    .eq("owner_id", ownerId)
    .in("listing_id", listingIds);

  if (error) {
    if (isLeadsTableMissingError(error)) return counts;
    return counts;
  }

  for (const row of data ?? []) {
    const id = row.listing_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}
