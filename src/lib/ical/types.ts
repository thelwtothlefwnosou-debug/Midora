export type ExternalCalendarProvider = "airbnb" | "booking" | "vrbo" | "other";

export type ExternalCalendarSyncStatus =
  | "pending"
  | "syncing"
  | "success"
  | "error"
  | "needs_attention";

export type ListingExternalCalendar = {
  id: string;
  listing_id: string;
  owner_id: string;
  provider: ExternalCalendarProvider;
  display_name: string | null;
  /** Present only in trusted server contexts — never send to public clients. */
  calendar_url?: string;
  /** Masked for owner UI. */
  calendar_url_masked?: string;
  enabled: boolean;
  last_synced_at: string | null;
  last_successful_sync_at: string | null;
  last_sync_status: ExternalCalendarSyncStatus;
  last_error: string | null;
  last_event_count: number | null;
  sync_lock_until: string | null;
  created_at: string;
  updated_at: string;
};

export type UnavailablePeriodSource = "manual" | "external_calendar";

export const EXTERNAL_CALENDAR_PROVIDERS: ExternalCalendarProvider[] = [
  "airbnb",
  "booking",
  "vrbo",
  "other",
];

export const MANUAL_SYNC_MIN_INTERVAL_MS = 60_000;
export const SYNC_LOCK_TTL_MS = 2 * 60_000;
export const CRON_BATCH_SIZE = 25;
