"use client";

import { useState, useTransition } from "react";
import { CalendarRange, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { updateListingAvailability } from "@/lib/actions";
import {
  formatAvailabilityMonthNote,
  formatListingAvailabilityText,
  LISTING_AVAILABILITY_STATUS_OPTIONS,
  parseAvailabilityMonthInput,
  parseListingAvailabilityStatus,
  type ListingAvailabilityStatus,
} from "@/lib/listing-availability-status";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  availabilityStatus?: ListingAvailabilityStatus | null;
  availabilityNote?: string | null;
  compact?: boolean;
  variant?: "monthly" | "default";
  className?: string;
};

const STATUS_LABEL_KEYS: Record<ListingAvailabilityStatus, "statusAvailableNow" | "statusFromMonth" | "statusUponRequest"> = {
  available_now: "statusAvailableNow",
  from_month: "statusFromMonth",
  upon_request: "statusUponRequest",
};

export function ListingAvailabilityEditor({
  listingId,
  availabilityStatus,
  availabilityNote,
  compact = false,
  variant = "default",
  className,
}: Props) {
  const t = useTranslations("Workspace.availabilityEditor");
  const tListing = useTranslations("Listing");
  const locale = useLocale();
  const [status, setStatus] = useState<ListingAvailabilityStatus>(
    parseListingAvailabilityStatus(availabilityStatus ?? undefined)
  );
  const [monthValue, setMonthValue] = useState(() =>
    parseAvailabilityMonthInput(availabilityNote)
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const noteForPreview =
    status === "from_month" && monthValue
      ? formatAvailabilityMonthNote(monthValue, locale)
      : null;

  const preview = formatListingAvailabilityText(
    {
      availability_status: status,
      availability_note: noteForPreview,
    },
    (key, values) => tListing(key, values)
  );

  const title = variant === "monthly" ? t("titleMonthly") : t("titleDefault");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (status === "from_month" && !monthValue) {
      setError(t("monthRequired"));
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("availability_status", status);
      fd.set(
        "availability_note",
        status === "from_month" && monthValue
          ? formatAvailabilityMonthNote(monthValue, locale)
          : ""
      );
      const result = await updateListingAvailability(listingId, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <form
      onSubmit={handleSave}
      className={cn(
        "rounded-xl border border-border bg-sand/40",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-charcoal">
        <CalendarRange className="h-4 w-4 text-gold" />
        {title}
        {saved && (
          <span className="inline-flex items-center gap-1 text-teal">
            <Check className="h-3.5 w-3.5" />
            {t("saved")}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {LISTING_AVAILABILITY_STATUS_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              status === option.value
                ? "border-gold/40 bg-white text-charcoal"
                : "border-transparent bg-white/60 text-charcoal/80 hover:bg-white"
            )}
          >
            <input
              type="radio"
              name={`availability_status_${listingId}`}
              value={option.value}
              checked={status === option.value}
              onChange={() => setStatus(option.value)}
              className="mt-0.5 accent-gold"
            />
            <span>{t(STATUS_LABEL_KEYS[option.value])}</span>
          </label>
        ))}
      </div>

      {status === "from_month" && (
        <label className="mt-3 block">
          <span className="text-[10px] uppercase tracking-wide text-muted">{t("monthLabel")}</span>
          <input
            type="month"
            required
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold/40"
          />
        </label>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          {status === "from_month" && noteForPreview
            ? t("availableFromPreview", { note: noteForPreview })
            : t("previewLabel", { preview })}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </form>
  );
}
