"use client";

import { useState, useTransition } from "react";
import { DoorOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { saveListingArrivalSettings } from "@/lib/listing-photo-rooms";
import { ARRIVAL_LABELS, getArrivalLabel } from "@/lib/house-rules";
import type { ArrivalMethod, ListingWithImages } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-gold/50";

type Props = {
  listing: ListingWithImages;
};

export function ListingArrivalEditor({ listing }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Workspace.arrivalEditor");
  const tRules = useTranslations("Listing.houseRules");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveListingArrivalSettings(listing.id, fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage(t("saved"));
    });
  }

  return (
    <GlassCard id="listing-arrival" className="mt-6 p-6">
      <div className="flex items-start gap-3">
        <DoorOpen className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="text-xs text-muted uppercase">{t("checkInFrom")}</span>
          <input
            name="check_in_from"
            type="time"
            defaultValue={listing.check_in_from ?? ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="text-xs text-muted uppercase">{t("checkInTo")}</span>
          <input
            name="check_in_to"
            type="time"
            defaultValue={listing.check_in_to ?? ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="text-xs text-muted uppercase">{t("checkOutUntil")}</span>
          <input
            name="check_out_until"
            type="time"
            defaultValue={listing.check_out_until ?? ""}
            className={inputClass}
          />
        </label>
        <label>
          <span className="text-xs text-muted uppercase">{t("arrivalMethod")}</span>
          <select
            name="arrival_method"
            defaultValue={listing.arrival_method ?? ""}
            className={inputClass}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {(Object.keys(ARRIVAL_LABELS) as ArrivalMethod[]).map((value) => (
              <option key={value} value={value}>
                {getArrivalLabel(value, tRules)}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-xl bg-charcoal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {pending ? t("saving") : t("save")}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm text-teal">{message}</p>}
    </GlassCard>
  );
}
