"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { FREE_STAYS_PATH } from "@/lib/free-hosting";

/**
 * Lightweight discovery search shell for /free-stays.
 * Persists query on the same route until offer matching is wired to listings.
 */
export function FreeStaysSearchBar() {
  const t = useTranslations("FreeStays.search");
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState("1");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (where.trim()) params.set("city", where.trim());
    if (from) params.set("interestFrom", from);
    if (to) params.set("interestTo", to);
    if (guests) params.set("guests", guests);
    const qs = params.toString();
    router.push(qs ? `${FREE_STAYS_PATH}?${qs}` : FREE_STAYS_PATH);
  }

  const fieldClass =
    "w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-charcoal outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.5rem] border border-charcoal/8 bg-white p-4 shadow-soft sm:p-5"
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
