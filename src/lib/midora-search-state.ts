import type { DateRangeValue } from "@/components/availability/InterestDateRangePicker";
import type { RentalType } from "@/lib/rental-types";

/** sessionStorage fallback — URL always wins when present. */
export const LAST_SEARCH_STATE_KEY = "midora:lastSearchState";

import type { ReadonlyURLSearchParams } from "next/navigation";

/** Params preserved when opening listing detail or returning to search. */
export const SEARCH_PRESERVE_KEYS = [
  "rentalType",
  "city",
  "area",
  "district",
  "nearby",
  "polygon",
  "bounds",
  "interestFrom",
  "interestTo",
  "start",
  "end",
  "checkIn",
  "checkOut",
  "startMonth",
  "durationMonths",
  "guests",
  "pets",
  "page",
  "rs",
  "map",
  "sort",
] as const;

export type MidoraSearchState = {
  rentalType: RentalType;
  city?: string;
  area?: string;
  district?: string;
  nearby?: string;
  polygon?: string;
  interestFrom?: string;
  interestTo?: string;
  startMonth?: string;
  durationMonths?: string;
  guests?: string;
  pets?: string;
};

function readParam(
  params: URLSearchParams | ReadonlyURLSearchParams,
  key: string
): string | undefined {
  const v = params.get(key)?.trim();
  return v || undefined;
}

export function parseDateRangeFromSearchParams(
  params: URLSearchParams | ReadonlyURLSearchParams
): DateRangeValue {
  const from =
    readParam(params, "interestFrom") ??
    readParam(params, "start") ??
    readParam(params, "checkIn");
  const to =
    readParam(params, "interestTo") ??
    readParam(params, "end") ??
    readParam(params, "checkOut");
  if (from && to && from !== to) return { start: from, end: to };
  return null;
}

export function resolveRentalTypeFromParams(
  params: URLSearchParams | ReadonlyURLSearchParams | Record<string, string | undefined>
): RentalType {
  const raw =
    params instanceof URLSearchParams || "get" in params
      ? readParam(params as URLSearchParams, "rentalType") ??
        readParam(params as URLSearchParams, "mode")
      : params.rentalType?.trim() || (params as Record<string, string>).mode?.trim();
  if (raw === "short_term" || raw === "monthly") return raw;
  return "short_term";
}

export function parseSearchParams(
  params: URLSearchParams | ReadonlyURLSearchParams | Record<string, string | undefined>
): MidoraSearchState {
  if (params instanceof URLSearchParams || "get" in params) {
    const p = params as URLSearchParams;
    const range = parseDateRangeFromSearchParams(p);
    return {
      rentalType: resolveRentalTypeFromParams(p),
      city: readParam(p, "city"),
      area: readParam(p, "area"),
      district: readParam(p, "district"),
      nearby: readParam(p, "nearby"),
      polygon: readParam(p, "polygon"),
      interestFrom: range?.start,
      interestTo: range?.end,
      startMonth: readParam(p, "startMonth"),
      durationMonths: readParam(p, "durationMonths"),
      guests: readParam(p, "guests"),
      pets: readParam(p, "pets"),
    };
  }

  const record = params as Record<string, string | undefined>;
  const from =
    record.interestFrom?.trim() ||
    record.start?.trim() ||
    record.checkIn?.trim() ||
    undefined;
  const to =
    record.interestTo?.trim() ||
    record.end?.trim() ||
    record.checkOut?.trim() ||
    undefined;

  return {
    rentalType: resolveRentalTypeFromParams(record),
    city: record.city?.trim() || undefined,
    area: record.area?.trim() || undefined,
    district: record.district?.trim() || undefined,
    nearby: record.nearby?.trim() || undefined,
    polygon: record.polygon?.trim() || undefined,
    interestFrom: from,
    interestTo: to && from && to !== from ? to : undefined,
    startMonth: record.startMonth?.trim() || undefined,
    durationMonths: record.durationMonths?.trim() || undefined,
    guests: record.guests?.trim() || undefined,
    pets: record.pets?.trim() || undefined,
  };
}

export function buildSearchParams(
  state: Partial<MidoraSearchState> | URLSearchParams | string
): URLSearchParams {
  if (typeof state === "string") {
    return new URLSearchParams(state);
  }
  if (state instanceof URLSearchParams) {
    return new URLSearchParams(state.toString());
  }

  const next = new URLSearchParams();
  const rt = state.rentalType ?? "short_term";
  next.set("rentalType", rt);

  if (state.city) next.set("city", state.city);
  if (state.area) next.set("area", state.area);
  if (state.district) next.set("district", state.district);
  if (state.nearby) next.set("nearby", state.nearby);
  if (state.polygon) next.set("polygon", state.polygon);

  if (rt === "short_term") {
    if (state.interestFrom) {
      next.set("interestFrom", state.interestFrom);
      next.set("start", state.interestFrom);
    }
    if (state.interestTo) {
      next.set("interestTo", state.interestTo);
      next.set("end", state.interestTo);
    }
  } else if (rt === "monthly") {
    if (state.startMonth) next.set("startMonth", state.startMonth);
    if (state.durationMonths) next.set("durationMonths", state.durationMonths);
  }

  if (state.guests) next.set("guests", state.guests);
  if (state.pets && state.pets !== "0") next.set("pets", state.pets);

  return next;
}

export function copySearchParams(
  source: URLSearchParams | ReadonlyURLSearchParams | string | null | undefined,
  keys: readonly string[] = SEARCH_PRESERVE_KEYS
): URLSearchParams {
  const next = new URLSearchParams();
  if (!source) return next;

  const src =
    typeof source === "string" ? new URLSearchParams(source) : new URLSearchParams(source.toString());

  for (const key of keys) {
    const value = src.get(key)?.trim();
    if (value) next.set(key, value);
  }

  if (!next.has("rentalType")) {
    next.set("rentalType", "short_term");
  }

  return next;
}

export function getSearchReturnUrl(
  params?: URLSearchParams | ReadonlyURLSearchParams | string | null
): string {
  const built = copySearchParams(params ?? null);
  const qs = built.toString();
  return qs ? `/listings?${qs}` : "/listings?rentalType=short_term";
}

export function saveLastSearchState(params: URLSearchParams | string): void {
  if (typeof window === "undefined") return;
  const qs = typeof params === "string" ? params : params.toString();
  if (!qs) return;
  try {
    sessionStorage.setItem(LAST_SEARCH_STATE_KEY, qs);
  } catch {
    /* quota / private mode */
  }
}

export function loadLastSearchState(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_SEARCH_STATE_KEY);
    if (!raw?.trim()) return null;
    return new URLSearchParams(raw);
  } catch {
    return null;
  }
}

export function getSearchReturnUrlWithFallback(
  params?: URLSearchParams | ReadonlyURLSearchParams | null
): string {
  const fromUrl = params?.toString();
  if (fromUrl) return getSearchReturnUrl(params);
  const stored = loadLastSearchState();
  if (stored?.toString()) return getSearchReturnUrl(stored);
  return "/listings?rentalType=short_term";
}

export function applyDateRangeToSearchParams(
  params: URLSearchParams,
  range: DateRangeValue
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.delete("interestFrom");
  next.delete("interestTo");
  next.delete("start");
  next.delete("end");
  next.delete("checkIn");
  next.delete("checkOut");

  if (range?.start && range.end && range.start !== range.end) {
    next.set("interestFrom", range.start);
    next.set("interestTo", range.end);
    next.set("start", range.start);
    next.set("end", range.end);
  }

  return next;
}

export function applyGuestsToSearchParams(
  params: URLSearchParams,
  guests: number
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  if (guests > 0) next.set("guests", String(guests));
  else next.delete("guests");
  return next;
}
