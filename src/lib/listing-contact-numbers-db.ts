import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ListingContactNumber } from "@/lib/types";

export async function getListingContactNumbers(
  listingId: string
): Promise<ListingContactNumber[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_contact_numbers")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as ListingContactNumber[];
}

export async function getPublicListingContactNumbers(
  listingId: string
): Promise<ListingContactNumber[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listing_contact_numbers")
    .select("*")
    .eq("listing_id", listingId)
    .eq("visibility", "public")
    .order("is_primary", { ascending: false });

  if (error) return [];
  return (data ?? []) as ListingContactNumber[];
}

export async function getLeadRepliesForLeads(leadIds: string[]) {
  const supabase = await createClient();
  if (!supabase || !leadIds.length) return new Map<string, import("@/lib/types").PropertyLeadReply[]>();

  const { data, error } = await supabase
    .from("property_lead_replies")
    .select("*")
    .in("lead_id", leadIds)
    .order("created_at", { ascending: true });

  if (error) return new Map();

  const map = new Map<string, NonNullable<typeof data>>();
  for (const row of data ?? []) {
    const list = map.get(row.lead_id) ?? [];
    list.push(row);
    map.set(row.lead_id, list);
  }
  return map;
}
