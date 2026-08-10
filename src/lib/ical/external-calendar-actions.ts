"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireListingOwner } from "@/lib/require-auth";
import {
  previewExternalCalendarUrl,
  syncExternalCalendarById,
} from "@/lib/ical/sync-external-calendar";
import { listOwnerExternalCalendars } from "@/lib/ical/external-calendars-db";
import { MANUAL_SYNC_MIN_INTERVAL_MS, EXTERNAL_CALENDAR_PROVIDERS } from "@/lib/ical/types";
import type { ExternalCalendarProvider } from "@/lib/ical/types";
import { randomBytes } from "node:crypto";

async function requireShortTermOwner(listingId: string) {
  const auth = await requireListingOwner(listingId, "owner_only");
  if ("error" in auth) return auth;

  const { data: listing } = await auth.supabase
    .from("listings")
    .select("rental_type")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.rental_type !== "short_term") {
    return { error: "icalShortTermOnly" as const };
  }

  return auth;
}

function isProvider(value: string): value is ExternalCalendarProvider {
  return (EXTERNAL_CALENDAR_PROVIDERS as string[]).includes(value);
}

export async function listListingExternalCalendars(listingId: string) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const calendars = await listOwnerExternalCalendars(
    auth.supabase,
    listingId,
    auth.user.id
  );
  return { calendars };
}

/** Step A: validate + preview periods without saving. */
export async function previewExternalCalendarConnection(input: {
  listingId: string;
  calendarUrl: string;
}) {
  const auth = await requireShortTermOwner(input.listingId);
  if ("error" in auth) return { error: auth.error, code: "auth" as const };

  const url = input.calendarUrl.trim();
  const preview = await previewExternalCalendarUrl(url);
  if (!preview.ok) {
    return {
      error:
        preview.error === "invalid_ics" ? "icalInvalidContent" : "icalConnectFailed",
      code: "validation" as const,
    };
  }

  return {
    ok: true as const,
    eventCount: preview.eventCount,
    ranges: preview.ranges,
  };
}

/** Step B: after owner confirms preview — save + first sync. */
export async function activateExternalCalendar(input: {
  listingId: string;
  provider: string;
  displayName?: string | null;
  calendarUrl: string;
}) {
  const auth = await requireShortTermOwner(input.listingId);
  if ("error" in auth) return { error: auth.error, code: "auth" as const };

  if (!isProvider(input.provider)) {
    return { error: "icalInvalidProvider", code: "validation" as const };
  }

  const url = input.calendarUrl.trim();
  const preview = await previewExternalCalendarUrl(url);
  if (!preview.ok) {
    return {
      error:
        preview.error === "invalid_ics" ? "icalInvalidContent" : "icalConnectFailed",
      code: "validation" as const,
    };
  }

  const displayName = input.displayName?.trim() || null;

  const { data: inserted, error } = await auth.supabase
    .from("listing_external_calendars")
    .insert({
      listing_id: input.listingId,
      owner_id: auth.user.id,
      provider: input.provider,
      display_name: displayName,
      calendar_url: url,
      enabled: true,
      last_sync_status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.message?.includes("does not exist") || error?.code === "42P01") {
      return { error: "icalMigrationRequired", code: "migration" as const };
    }
    return { error: "icalConnectFailed", code: "db" as const };
  }

  const sync = await syncExternalCalendarById(auth.supabase, inserted.id);
  revalidatePath(`/dashboard/listings/${input.listingId}/availability`);
  revalidatePath(`/listings/${input.listingId}`);

  if (!sync.ok) {
    return {
      ok: true as const,
      calendarId: inserted.id,
      synced: false as const,
      error: "icalInitialSyncFailed",
      previewCount: preview.eventCount,
    };
  }

  return {
    ok: true as const,
    calendarId: inserted.id,
    synced: true as const,
    eventCount: sync.eventCount,
  };
}

/** @deprecated prefer preview + activate */
export async function connectExternalCalendar(input: {
  listingId: string;
  provider: string;
  displayName?: string | null;
  calendarUrl: string;
}) {
  return activateExternalCalendar(input);
}

export async function refreshExternalCalendar(calendarId: string, listingId: string) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data: calendar } = await auth.supabase
    .from("listing_external_calendars")
    .select("id, owner_id, listing_id, last_synced_at")
    .eq("id", calendarId)
    .eq("listing_id", listingId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!calendar) return { error: "icalNotFound" };

  if (calendar.last_synced_at) {
    const elapsed = Date.now() - Date.parse(calendar.last_synced_at);
    if (elapsed >= 0 && elapsed < MANUAL_SYNC_MIN_INTERVAL_MS) {
      return { error: "icalRateLimited" };
    }
  }

  const sync = await syncExternalCalendarById(auth.supabase, calendarId);
  revalidatePath(`/dashboard/listings/${listingId}/availability`);
  revalidatePath(`/listings/${listingId}`);

  if (!sync.ok) {
    return { error: "icalSyncFailed", detail: sync.error };
  }

  return { ok: true as const, eventCount: sync.eventCount };
}

export async function disconnectExternalCalendar(calendarId: string, listingId: string) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data: calendar } = await auth.supabase
    .from("listing_external_calendars")
    .select("id")
    .eq("id", calendarId)
    .eq("listing_id", listingId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!calendar) return { error: "icalNotFound" };

  // Cascade deletes external periods via FK; also explicit for clarity
  await auth.supabase
    .from("listing_unavailable_periods")
    .delete()
    .eq("external_calendar_id", calendarId)
    .eq("source", "external_calendar");

  const { error } = await auth.supabase
    .from("listing_external_calendars")
    .delete()
    .eq("id", calendarId)
    .eq("owner_id", auth.user.id);

  if (error) return { error: "icalDisconnectFailed" };

  revalidatePath(`/dashboard/listings/${listingId}/availability`);
  revalidatePath(`/listings/${listingId}`);
  return { ok: true as const };
}

export async function updateExternalCalendar(
  calendarId: string,
  listingId: string,
  patch: { displayName?: string | null; calendarUrl?: string; provider?: string }
) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.displayName !== undefined) {
    updates.display_name = patch.displayName?.trim() || null;
  }
  if (patch.provider !== undefined) {
    if (!isProvider(patch.provider)) return { error: "icalInvalidProvider" };
    updates.provider = patch.provider;
  }
  if (patch.calendarUrl !== undefined) {
    const url = patch.calendarUrl.trim();
    const preview = await previewExternalCalendarUrl(url);
    if (!preview.ok) {
      return {
        error:
          preview.error === "invalid_ics"
            ? "icalInvalidContent"
            : "icalConnectFailed",
      };
    }
    updates.calendar_url = url;
  }

  const { error } = await auth.supabase
    .from("listing_external_calendars")
    .update(updates)
    .eq("id", calendarId)
    .eq("listing_id", listingId)
    .eq("owner_id", auth.user.id);

  if (error) return { error: "icalUpdateFailed" };

  if (patch.calendarUrl) {
    const sync = await syncExternalCalendarById(auth.supabase, calendarId);
    revalidatePath(`/dashboard/listings/${listingId}/availability`);
    if (!sync.ok) {
      return { ok: true as const, synced: false as const, error: "icalInitialSyncFailed" };
    }
  }

  revalidatePath(`/dashboard/listings/${listingId}/availability`);
  return { ok: true as const, synced: true as const };
}

export async function ensureListingCalendarExportFeed(listingId: string) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const { data: existing } = await auth.supabase
    .from("listing_calendar_export_feeds")
    .select("token, enabled")
    .eq("listing_id", listingId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (existing?.token) {
    return { token: existing.token as string, enabled: Boolean(existing.enabled) };
  }

  const token = randomBytes(32).toString("base64url");
  const { data, error } = await auth.supabase
    .from("listing_calendar_export_feeds")
    .insert({
      listing_id: listingId,
      owner_id: auth.user.id,
      token,
      enabled: true,
    })
    .select("token")
    .single();

  if (error || !data) {
    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      return { error: "icalMigrationRequired" };
    }
    return { error: "icalExportFailed" };
  }

  return { token: data.token as string, enabled: true };
}

export async function regenerateListingCalendarExportFeed(listingId: string) {
  const auth = await requireShortTermOwner(listingId);
  if ("error" in auth) return { error: auth.error };

  const token = randomBytes(32).toString("base64url");
  const now = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("listing_calendar_export_feeds")
    .upsert(
      {
        listing_id: listingId,
        owner_id: auth.user.id,
        token,
        enabled: true,
        rotated_at: now,
      },
      { onConflict: "listing_id" }
    )
    .select("token")
    .single();

  if (error || !data) return { error: "icalExportFailed" };
  return { token: data.token as string };
}

/** Cron entry — service role only. */
export async function cronSyncDueExternalCalendars(limit = 25) {
  const service = createServiceClient();
  if (!service) return { error: "no_service", synced: 0 };

  const staleBefore = new Date(Date.now() - 25 * 60 * 1000).toISOString();

  const { data: due } = await service
    .from("listing_external_calendars")
    .select("id")
    .eq("enabled", true)
    .or(`last_synced_at.is.null,last_synced_at.lte.${staleBefore}`)
    .neq("last_sync_status", "syncing")
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  let synced = 0;
  let failed = 0;
  for (const row of due ?? []) {
    const result = await syncExternalCalendarById(service, row.id as string);
    if (result.ok) synced += 1;
    else failed += 1;
  }

  return { synced, failed, examined: (due ?? []).length };
}
