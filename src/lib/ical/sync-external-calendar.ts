import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  halfOpenToInclusive,
  looksLikeIcs,
  parseIcsBusyRanges,
  type HalfOpenBusyRange,
} from "@/lib/ical/ics-parse";
import { safeFetchText } from "@/lib/ical/safe-fetch";
import { SYNC_LOCK_TTL_MS } from "@/lib/ical/types";

export type SyncCalendarResult =
  | {
      ok: true;
      eventCount: number;
      upserted: number;
      removed: number;
      durationMs: number;
    }
  | {
      ok: false;
      error:
        | "not_found"
        | "locked"
        | "fetch"
        | "invalid_ics"
        | "db"
        | "disabled";
      message?: string;
      durationMs: number;
      /** true when previous successful blocks were preserved */
      keptLastKnownGood?: boolean;
    };

export type PreviewCalendarResult =
  | {
      ok: true;
      eventCount: number;
      ranges: Array<{ startDate: string; endExclusive: string; endInclusive: string }>;
    }
  | { ok: false; error: "fetch" | "invalid_ics"; detail?: string };

type CalendarRow = {
  id: string;
  listing_id: string;
  owner_id: string;
  calendar_url: string;
  enabled: boolean;
  provider: string;
  sync_lock_until: string | null;
};

function logSync(event: string, data: Record<string, unknown>) {
  console.info(`[ical-sync] ${event}`, data);
}

async function tryAcquireLock(
  supabase: SupabaseClient,
  calendarId: string
): Promise<boolean> {
  const now = Date.now();
  const lockUntil = new Date(now + SYNC_LOCK_TTL_MS).toISOString();

  const { data: row } = await supabase
    .from("listing_external_calendars")
    .select("sync_lock_until")
    .eq("id", calendarId)
    .maybeSingle();

  const existing = row?.sync_lock_until ? Date.parse(row.sync_lock_until) : 0;
  if (existing && existing > now) return false;

  const { data, error } = await supabase
    .from("listing_external_calendars")
    .update({
      sync_lock_until: lockUntil,
      last_sync_status: "syncing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", calendarId)
    .or(`sync_lock_until.is.null,sync_lock_until.lte.${new Date(now).toISOString()}`)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[ical-sync] lock", error.message);
    return false;
  }
  return Boolean(data);
}

async function releaseLock(
  supabase: SupabaseClient,
  calendarId: string,
  patch: Record<string, unknown>
) {
  await supabase
    .from("listing_external_calendars")
    .update({
      ...patch,
      sync_lock_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", calendarId);
}

async function fetchAndParse(url: string): Promise<
  | { ok: true; ranges: HalfOpenBusyRange[] }
  | { ok: false; error: "fetch" | "invalid_ics"; detail?: string }
> {
  const fetched = await safeFetchText(url);
  if (!fetched.ok) return { ok: false, error: "fetch", detail: fetched.error };
  if (!looksLikeIcs(fetched.body)) return { ok: false, error: "invalid_ics" };
  const parsed = parseIcsBusyRanges(fetched.body);
  if (!parsed.ok) return { ok: false, error: "invalid_ics", detail: parsed.error };
  return { ok: true, ranges: parsed.ranges };
}

export async function previewExternalCalendarUrl(url: string): Promise<PreviewCalendarResult> {
  const result = await fetchAndParse(url);
  if (!result.ok) return result;

  const ranges = result.ranges
    .map((r) => {
      const incl = halfOpenToInclusive(r);
      if (!incl) return null;
      return {
        startDate: r.startDate,
        endExclusive: r.endExclusive,
        endInclusive: incl.endDate,
      };
    })
    .filter(Boolean) as Array<{
    startDate: string;
    endExclusive: string;
    endInclusive: string;
  }>;

  return { ok: true, eventCount: ranges.length, ranges };
}

/**
 * Full sync with last-known-good:
 * 1) fetch+parse entire feed (no DB writes)
 * 2) on failure → status=error, KEEP existing external blocks
 * 3) on success → upsert all, then delete stale (only then)
 */
export async function syncExternalCalendarById(
  supabase: SupabaseClient,
  calendarId: string
): Promise<SyncCalendarResult> {
  const started = Date.now();

  const { data: calendar, error: loadError } = await supabase
    .from("listing_external_calendars")
    .select("id, listing_id, owner_id, calendar_url, enabled, provider, sync_lock_until")
    .eq("id", calendarId)
    .maybeSingle();

  if (loadError || !calendar) {
    return { ok: false, error: "not_found", durationMs: Date.now() - started };
  }

  const row = calendar as CalendarRow;
  if (!row.enabled) {
    return { ok: false, error: "disabled", durationMs: Date.now() - started };
  }

  const locked = await tryAcquireLock(supabase, calendarId);
  if (!locked) {
    return { ok: false, error: "locked", durationMs: Date.now() - started };
  }

  logSync("started", {
    calendarId,
    listingId: row.listing_id,
    provider: row.provider,
  });

  const parsedFeed = await fetchAndParse(row.calendar_url);
  if (!parsedFeed.ok) {
    await releaseLock(supabase, calendarId, {
      last_sync_status: "error",
      last_error: `${parsedFeed.error}:${parsedFeed.detail ?? ""}`.slice(0, 300),
      last_synced_at: new Date().toISOString(),
    });
    logSync("failed_kept_last_known_good", {
      calendarId,
      reason: parsedFeed.error,
    });
    return {
      ok: false,
      error: parsedFeed.error === "fetch" ? "fetch" : "invalid_ics",
      message: parsedFeed.detail,
      durationMs: Date.now() - started,
      keptLastKnownGood: true,
    };
  }

  const inclusive = parsedFeed.ranges
    .map((r) => halfOpenToInclusive(r))
    .filter(Boolean) as Array<{
    startDate: string;
    endDate: string;
    uid: string;
  }>;

  const nowIso = new Date().toISOString();
  const feedUids = new Set(inclusive.map((r) => r.uid));

  // Apply upserts first — never delete until all upserts succeed
  let upserted = 0;
  for (const range of inclusive) {
    const { data: existing } = await supabase
      .from("listing_unavailable_periods")
      .select("id")
      .eq("external_calendar_id", calendarId)
      .eq("external_event_uid", range.uid)
      .maybeSingle();

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("listing_unavailable_periods")
        .update({
          start_date: range.startDate,
          end_date: range.endDate,
          synced_at: nowIso,
          updated_at: nowIso,
          reason: "unavailable",
          note: null,
          source: "external_calendar",
        })
        .eq("id", existing.id);
      if (updErr) {
        await releaseLock(supabase, calendarId, {
          last_sync_status: "error",
          last_error: updErr.message.slice(0, 300),
          last_synced_at: nowIso,
        });
        return {
          ok: false,
          error: "db",
          message: updErr.message,
          durationMs: Date.now() - started,
          keptLastKnownGood: true,
        };
      }
    } else {
      const { error: insErr } = await supabase.from("listing_unavailable_periods").insert({
        listing_id: row.listing_id,
        owner_id: row.owner_id,
        start_date: range.startDate,
        end_date: range.endDate,
        reason: "unavailable",
        note: null,
        source: "external_calendar",
        external_calendar_id: calendarId,
        external_event_uid: range.uid,
        synced_at: nowIso,
      });
      if (insErr) {
        await releaseLock(supabase, calendarId, {
          last_sync_status: "error",
          last_error: insErr.message.slice(0, 300),
          last_synced_at: nowIso,
        });
        return {
          ok: false,
          error: "db",
          message: insErr.message,
          durationMs: Date.now() - started,
          keptLastKnownGood: true,
        };
      }
    }
    upserted += 1;
  }

  // Only after full successful apply: remove stale UIDs for THIS calendar
  const { data: existingBlocks, error: existingErr } = await supabase
    .from("listing_unavailable_periods")
    .select("id, external_event_uid")
    .eq("external_calendar_id", calendarId)
    .eq("source", "external_calendar");

  if (existingErr) {
    await releaseLock(supabase, calendarId, {
      last_sync_status: "needs_attention",
      last_error: existingErr.message.slice(0, 300),
      last_event_count: inclusive.length,
      last_synced_at: nowIso,
    });
    return {
      ok: false,
      error: "db",
      message: existingErr.message,
      durationMs: Date.now() - started,
      keptLastKnownGood: true,
    };
  }

  const staleIds = (existingBlocks ?? [])
    .filter((b) => b.external_event_uid && !feedUids.has(b.external_event_uid))
    .map((b) => b.id as string);

  let removed = 0;
  if (staleIds.length > 0) {
    const { error: delErr } = await supabase
      .from("listing_unavailable_periods")
      .delete()
      .in("id", staleIds)
      .eq("source", "external_calendar")
      .eq("external_calendar_id", calendarId);

    if (delErr) {
      await releaseLock(supabase, calendarId, {
        last_sync_status: "needs_attention",
        last_error: delErr.message.slice(0, 300),
        last_event_count: inclusive.length,
        last_synced_at: nowIso,
      });
      return {
        ok: false,
        error: "db",
        message: delErr.message,
        durationMs: Date.now() - started,
        keptLastKnownGood: true,
      };
    }
    removed = staleIds.length;
  }

  const durationMs = Date.now() - started;
  await releaseLock(supabase, calendarId, {
    last_sync_status: "success",
    last_error: null,
    last_event_count: inclusive.length,
    last_successful_sync_at: nowIso,
    last_synced_at: nowIso,
  });

  logSync("success", {
    calendarId,
    listingId: row.listing_id,
    provider: row.provider,
    eventCount: inclusive.length,
    upserted,
    removed,
    durationMs,
  });

  return {
    ok: true,
    eventCount: inclusive.length,
    upserted,
    removed,
    durationMs,
  };
}

export async function validateCalendarUrlContent(url: string): Promise<
  | { ok: true; eventCount: number }
  | { ok: false; error: "fetch" | "invalid_ics"; detail?: string }
> {
  const preview = await previewExternalCalendarUrl(url);
  if (!preview.ok) return preview;
  return { ok: true, eventCount: preview.eventCount };
}
