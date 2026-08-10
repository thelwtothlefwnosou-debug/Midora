import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { maskCalendarUrl } from "@/lib/ical/url-guards";
import type {
  ExternalCalendarProvider,
  ListingExternalCalendar,
} from "@/lib/ical/types";

type RawCalendar = {
  id: string;
  listing_id: string;
  owner_id: string;
  provider: ExternalCalendarProvider;
  display_name: string | null;
  calendar_url: string;
  enabled: boolean;
  last_synced_at: string | null;
  last_successful_sync_at: string | null;
  last_sync_status: ListingExternalCalendar["last_sync_status"];
  last_error: string | null;
  last_event_count: number | null;
  sync_lock_until: string | null;
  created_at: string;
  updated_at: string;
};

export function toOwnerCalendarView(row: RawCalendar): ListingExternalCalendar {
  return {
    id: row.id,
    listing_id: row.listing_id,
    owner_id: row.owner_id,
    provider: row.provider,
    display_name: row.display_name,
    calendar_url_masked: maskCalendarUrl(row.calendar_url),
    enabled: row.enabled,
    last_synced_at: row.last_synced_at,
    last_successful_sync_at: row.last_successful_sync_at,
    last_sync_status: row.last_sync_status,
    last_error: row.last_error,
    last_event_count: row.last_event_count,
    sync_lock_until: row.sync_lock_until,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listOwnerExternalCalendars(
  supabase: SupabaseClient,
  listingId: string,
  ownerId: string
): Promise<ListingExternalCalendar[]> {
  const { data, error } = await supabase
    .from("listing_external_calendars")
    .select("*")
    .eq("listing_id", listingId)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    console.error("[external-calendars] list", error.message);
    return [];
  }

  return (data as RawCalendar[]).map(toOwnerCalendarView);
}

export async function getExternalCalendarRaw(
  supabase: SupabaseClient,
  calendarId: string
): Promise<RawCalendar | null> {
  const { data, error } = await supabase
    .from("listing_external_calendars")
    .select("*")
    .eq("id", calendarId)
    .maybeSingle();

  if (error || !data) return null;
  return data as RawCalendar;
}
