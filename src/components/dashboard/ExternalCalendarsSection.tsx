"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarPlus,
  Copy,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { PortalModal } from "@/components/ui/PortalModal";
import {
  activateExternalCalendar,
  disconnectExternalCalendar,
  ensureListingCalendarExportFeed,
  listListingExternalCalendars,
  previewExternalCalendarConnection,
  refreshExternalCalendar,
  regenerateListingCalendarExportFeed,
} from "@/lib/ical/external-calendar-actions";
import type { ExternalCalendarProvider, ListingExternalCalendar } from "@/lib/ical/types";
import { EXTERNAL_CALENDAR_PROVIDERS } from "@/lib/ical/types";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initialCalendars?: ListingExternalCalendar[];
};

type PreviewRange = {
  startDate: string;
  endExclusive: string;
  endInclusive: string;
};

function providerLabel(
  t: ReturnType<typeof useTranslations>,
  provider: ExternalCalendarProvider
): string {
  return t(`providers.${provider}`);
}

export function ExternalCalendarsSection({ listingId, initialCalendars = [] }: Props) {
  const t = useTranslations("Workspace.externalCalendars");
  const [calendars, setCalendars] = useState(initialCalendars);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [provider, setProvider] = useState<ExternalCalendarProvider>("airbnb");
  const [displayName, setDisplayName] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [previewRanges, setPreviewRanges] = useState<PreviewRange[]>([]);
  const [previewCount, setPreviewCount] = useState(0);

  useEffect(() => {
    startTransition(async () => {
      const result = await listListingExternalCalendars(listingId);
      if ("calendars" in result && result.calendars) setCalendars(result.calendars);
      const exp = await ensureListingCalendarExportFeed(listingId);
      if ("token" in exp && exp.token) {
        setExportUrl(`${window.location.origin}/api/calendar/${exp.token}.ics`);
      }
    });
  }, [listingId]);

  function reload() {
    startTransition(async () => {
      const result = await listListingExternalCalendars(listingId);
      if ("calendars" in result && result.calendars) setCalendars(result.calendars);
    });
  }

  function openConnect() {
    setError(null);
    setStep("form");
    setPreviewRanges([]);
    setOpen(true);
  }

  function handlePreview() {
    setError(null);
    startTransition(async () => {
      const result = await previewExternalCalendarConnection({
        listingId,
        calendarUrl,
      });
      if (!("ok" in result && result.ok)) {
        if ("error" in result && result.error) {
          setError(t(`errors.${result.error}` as "errors.icalConnectFailed"));
        }
        return;
      }
      setPreviewRanges(result.ranges);
      setPreviewCount(result.eventCount);
      setStep("preview");
    });
  }

  function handleActivate() {
    setError(null);
    startTransition(async () => {
      const result = await activateExternalCalendar({
        listingId,
        provider,
        displayName,
        calendarUrl,
      });
      if (!("ok" in result && result.ok)) {
        if ("error" in result && result.error) {
          setError(t(`errors.${result.error}` as "errors.icalConnectFailed"));
        }
        return;
      }
      setOpen(false);
      setCalendarUrl("");
      setDisplayName("");
      setStep("form");
      setFeedback(
        result.synced ? t("feedback.connectedSynced") : t("feedback.connectedSyncFailed")
      );
      reload();
    });
  }

  function handleRefresh(calendarId: string) {
    setError(null);
    startTransition(async () => {
      const result = await refreshExternalCalendar(calendarId, listingId);
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}` as "errors.icalSyncFailed"));
        reload();
        return;
      }
      setFeedback(t("feedback.refreshed"));
      reload();
    });
  }

  function handleDisconnect(calendarId: string) {
    if (!window.confirm(t("disconnectConfirm"))) return;
    startTransition(async () => {
      const result = await disconnectExternalCalendar(calendarId, listingId);
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}` as "errors.icalDisconnectFailed"));
        return;
      }
      setFeedback(t("feedback.disconnected"));
      reload();
    });
  }

  function handleCopyExport() {
    if (!exportUrl) return;
    void navigator.clipboard.writeText(exportUrl);
    setFeedback(t("feedback.exportCopied"));
  }

  function handleRotateExport() {
    if (!window.confirm(t("exportRotateConfirm"))) return;
    startTransition(async () => {
      const result = await regenerateListingCalendarExportFeed(listingId);
      if ("error" in result && result.error) {
        setError(t(`errors.${result.error}` as "errors.icalExportFailed"));
        return;
      }
      if ("token" in result && result.token) {
        setExportUrl(`${window.location.origin}/api/calendar/${result.token}.ics`);
        setFeedback(t("feedback.exportRotated"));
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold text-charcoal">
          {t("sectionTitle")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("sectionSubtitle")}</p>
        <p className="mt-2 text-xs text-muted">{t("periodicNote")}</p>
      </div>

      {feedback && (
        <p className="mt-3 rounded-lg border border-teal/25 bg-teal/5 px-3 py-2 text-sm text-teal">
          {feedback}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Step 1 — Midora export */}
      <div className="mt-5 rounded-xl border border-border bg-sand/15 px-3 py-4 sm:px-4">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {t("step1Label")}
        </p>
        <h4 className="mt-1 text-sm font-semibold text-charcoal">{t("exportTitle")}</h4>
        <p className="mt-1 text-xs text-muted">{t("exportBody")}</p>
        <p className="mt-2 text-xs text-muted">{t("exportHelper")}</p>
        {exportUrl && (
          <p className="mt-2 break-all font-mono text-[11px] text-charcoal/70">{exportUrl}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !exportUrl}
            onClick={handleCopyExport}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            {t("exportCopy")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleRotateExport}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-charcoal hover:bg-sand disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("exportRotate")}
          </button>
        </div>
      </div>

      {/* Step 2 — Connect external */}
      <div className="mt-4 rounded-xl border border-border px-3 py-4 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              {t("step2Label")}
            </p>
            <h4 className="mt-1 text-sm font-semibold text-charcoal">{t("connectTitle")}</h4>
          </div>
          <button
            type="button"
            onClick={openConnect}
            disabled={pending}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-charcoal/90 disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" />
            {t("connectCta")}
          </button>
        </div>

        <h4 className="mt-5 text-sm font-semibold text-charcoal">{t("title")}</h4>

        {calendars.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {calendars.map((cal) => (
              <li
                key={cal.id}
                className="rounded-xl border border-border bg-sand/10 px-3 py-3 sm:px-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal">
                      {cal.display_name || providerLabel(t, cal.provider)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {providerLabel(t, cal.provider)}
                      {cal.calendar_url_masked ? ` · ${cal.calendar_url_masked}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/80">
                      {t(`status.${cal.last_sync_status}`)}
                      {cal.last_successful_sync_at
                        ? ` · ${t("lastSuccess", {
                            when: new Date(cal.last_successful_sync_at).toLocaleString(),
                          })}`
                        : ""}
                    </p>
                    {cal.last_sync_status === "error" && (
                      <p className="mt-1 text-xs text-amber-800">{t("lastFailedKeep")}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleRefresh(cal.id)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-charcoal hover:bg-sand disabled:opacity-50"
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {t("refresh")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDisconnect(cal.id)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("disconnect")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <PortalModal
          open
          onClose={() => !pending && setOpen(false)}
          title={step === "form" ? t("modalTitle") : t("previewTitle")}
          titleId="external-calendar-modal"
          footer={
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => (step === "preview" ? setStep("form") : setOpen(false))}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
              >
                {step === "preview" ? t("back") : t("cancel")}
              </button>
              {step === "form" ? (
                <button
                  type="button"
                  disabled={pending || !calendarUrl.trim()}
                  onClick={handlePreview}
                  className={cn(
                    "rounded-xl bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  )}
                >
                  {pending ? t("connecting") : t("previewSubmit")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleActivate}
                  className="rounded-xl bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {pending ? t("connecting") : t("activateSubmit")}
                </button>
              )}
            </div>
          }
        >
          {step === "form" ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium uppercase text-muted">
                  {t("providerLabel")}
                </span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ExternalCalendarProvider)}
                  className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                >
                  {EXTERNAL_CALENDAR_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {providerLabel(t, p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase text-muted">{t("urlLabel")}</span>
                <input
                  type="url"
                  value={calendarUrl}
                  onChange={(e) => setCalendarUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
                <span className="mt-1 block text-xs text-muted">{t("urlHint")}</span>
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase text-muted">{t("nameLabel")}</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-charcoal">
                {t("previewFound", { count: previewCount })}
              </p>
              <p className="text-xs text-muted">{t("previewHint")}</p>
              <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm text-charcoal">
                {previewRanges.slice(0, 40).map((r) => (
                  <li key={`${r.startDate}-${r.endExclusive}`} className="rounded-lg bg-sand/40 px-3 py-2">
                    {r.startDate} → {r.endExclusive}{" "}
                    <span className="text-xs text-muted">
                      ({t("previewExclusiveHint")})
                    </span>
                  </li>
                ))}
              </ul>
              {previewRanges.length > 40 && (
                <p className="text-xs text-muted">+{previewRanges.length - 40}</p>
              )}
            </div>
          )}
        </PortalModal>
      )}
    </section>
  );
}
