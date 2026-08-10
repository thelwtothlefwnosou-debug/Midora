"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { freeHostingListingsHref } from "@/lib/free-hosting-paths";
import { cn } from "@/lib/utils";

/**
 * Discovery search for /free-stays → short-term listings with freeHosting=true.
 * Visually anchored to the hero as the primary product action.
 */
export function FreeStaysSearchBar({ className }: { className?: string }) {
  const t = useTranslations("FreeStays.search");
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState("1");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const extra: Record<string, string> = {};
    if (where.trim()) extra.city = where.trim();
    if (from) extra.interestFrom = from;
    if (to) extra.interestTo = to;
    if (guests) extra.guests = guests;
    router.push(freeHostingListingsHref(extra));
  }

  const fieldClass =
    "w-full rounded-xl border border-border/80 bg-white px-3.5 py-3 text-sm text-charcoal outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-[1.35rem] border border-charcoal/8 bg-white p-3.5 shadow-[0_18px_50px_-28px_rgba(44,40,37,0.45)] sm:p-4",
        className
      )}
      aria-label={t("aria")}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] lg:items-end">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            {t("where")}
          </span>
          <input
            type="text"
            name="city"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder={t("wherePlaceholder")}
            className={fieldClass}
            autoComplete="address-level2"
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            {t("from")}
          </span>
          <input
            type="date"
            name="interestFrom"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            {t("to")}
          </span>
          <input
            type="date"
            name="interestTo"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            {t("guests")}
          </span>
          <input
            type="number"
            name="guests"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className={fieldClass}
          />
        </label>
        <button type="submit" className="home-btn-primary h-[46px] w-full lg:w-auto lg:px-5">
          <Search className="h-4 w-4" aria-hidden />
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
