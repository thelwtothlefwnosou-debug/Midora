"use client";

import { useTranslations } from "next-intl";

export function SearchResultsSkeleton() {
  const t = useTranslations("Map");

  return (
    <div className="bg-white">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <div className="h-6 w-64 max-w-full animate-pulse rounded-lg bg-sand/70" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-sand/50" />
      </div>
      <div className="hidden lg:flex lg:items-start">
        <div className="w-[54%] shrink-0 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] rounded-xl bg-sand/60" />
                <div className="mt-3 h-4 w-3/4 rounded bg-sand/50" />
                <div className="mt-2 h-3 w-1/2 rounded bg-sand/40" />
                <div className="mt-2 h-4 w-1/3 rounded bg-sand/50" />
              </div>
            ))}
          </div>
        </div>
        <div
          className="sticky top-[calc(var(--listings-header-offset)+0.75rem)] w-[46%] shrink-0 self-start pb-6 pl-2 pr-6 pt-1"
          style={{
            height: "calc(100dvh - var(--listings-header-offset) - 1.75rem)",
          }}
        >
          <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[24px] border border-charcoal/10 bg-[#e8e8e8]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <span className="text-sm text-muted">{t("loading")}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[16/10] rounded-xl bg-sand/60" />
            <div className="mt-3 h-4 w-3/4 rounded bg-sand/50" />
            <div className="mt-2 h-3 w-1/2 rounded bg-sand/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
