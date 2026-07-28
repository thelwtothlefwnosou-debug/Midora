"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { listingsPageHref } from "@/lib/listings-pagination";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  /** Client-side paging (map bounds) — avoids full page navigation */
  onPageChange?: (page: number) => void;
};

function visiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}

export function ListingsPagination({
  currentPage,
  totalPages,
  totalCount,
  rangeStart,
  rangeEnd,
  onPageChange,
}: Props) {
  const t = useTranslations("Listings.pagination");
  const searchParams = useSearchParams();

  if (totalCount <= 0 || totalPages <= 1) return null;

  const pages = visiblePages(currentPage, totalPages);
  const prevHref =
    !onPageChange && currentPage > 1
      ? listingsPageHref(searchParams, currentPage - 1)
      : null;
  const nextHref =
    !onPageChange && currentPage < totalPages
      ? listingsPageHref(searchParams, currentPage + 1)
      : null;

  const pageBtnClass = (active: boolean) =>
    cn(
      "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium tabular-nums transition-colors",
      active
        ? "border-gold bg-gold text-white"
        : "border-border text-charcoal hover:bg-sand"
    );

  return (
    <nav
      className="border-t border-border bg-white px-4 py-6 pb-8 sm:px-6 lg:pb-10"
      aria-label={t("ariaLabel")}
    >
      <p className="mb-3 text-center text-sm text-muted">
        {t("rangeSummary", { start: rangeStart, end: rangeEnd, total: totalCount })}
        <span className="hidden sm:inline">
          {" "}
          · {t("pageOfTotal", { current: currentPage, total: totalPages })}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {onPageChange && currentPage > 1 ? (
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand sm:min-w-0"
            aria-label={t("previousAria")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("previous")}</span>
          </button>
        ) : prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand sm:min-w-0"
            aria-label={t("previousAria")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("previous")}</span>
          </Link>
        ) : (
          <span className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm text-muted opacity-40 sm:min-w-0">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("previous")}</span>
          </span>
        )}

        <div className="flex items-center gap-1">
          {pages.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-1 text-sm text-muted">
                …
              </span>
            ) : onPageChange ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={pageBtnClass(item === currentPage)}
              >
                {item}
              </button>
            ) : (
              <Link
                key={item}
                href={listingsPageHref(searchParams, item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={pageBtnClass(item === currentPage)}
              >
                {item}
              </Link>
            )
          )}
        </div>

        {onPageChange && currentPage < totalPages ? (
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand sm:min-w-0"
            aria-label={t("nextAria")}
          >
            <span className="hidden sm:inline">{t("next")}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-charcoal hover:bg-sand sm:min-w-0"
            aria-label={t("nextAria")}
          >
            <span className="hidden sm:inline">{t("next")}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm text-muted opacity-40 sm:min-w-0">
            <span className="hidden sm:inline">{t("next")}</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
