"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OwnerActionRequiredItem } from "@/lib/owner-listings-page";

type Props = {
  items: OwnerActionRequiredItem[];
  onShowAll?: () => void;
  maxVisible?: number;
};

/**
 * ONE panel for all action-required listings.
 * Never one banner bar per listing.
 */
export function DashboardListingsActionPanel({
  items,
  onShowAll,
  maxVisible = 3,
}: Props) {
  const t = useTranslations("Owner.actionPanel");

  if (items.length === 0) return null;

  const visible = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <section
      className="owner-action-panel"
      data-testid="owner-action-required-panel"
      aria-labelledby="owner-action-required-title"
    >
      <header className="owner-action-panel__head">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "color-mix(in srgb, var(--owner-status-action) 18%, white)",
              color: "var(--owner-status-action)",
            }}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="owner-action-required-title"
              className="text-sm font-semibold text-charcoal"
            >
              {t("title")}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-charcoal/65">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </header>

      <ul>
        {visible.map((item) => (
          <li key={item.id} className="owner-action-panel__row">
            <p className="min-w-0 flex-1 truncate text-sm text-charcoal">
              <span className="font-medium">«{item.title}»</span>
              <span className="text-muted">
                {" "}
                —{" "}
                {item.messageValues
                  ? t(item.messageKey, item.messageValues)
                  : t(item.messageKey)}
              </span>
            </p>
            <Link
              href={item.href}
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-charcoal hover:underline"
            >
              {t(item.ctaKey)}
              <ChevronRight className="h-3.5 w-3.5 opacity-55" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && onShowAll ? (
        <div className="border-t border-border/70 px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={onShowAll}
            className="text-xs font-semibold text-charcoal/75 hover:text-charcoal hover:underline"
          >
            {t("seeAll", { count: items.length })}
          </button>
        </div>
      ) : null}
    </section>
  );
}
