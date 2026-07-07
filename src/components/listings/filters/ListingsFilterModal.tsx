"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { RentalType } from "@/lib/rental-types";
import type { ListingsFilterValues } from "@/components/listings/ListingsFilters";
import type { PriceHistogramBucket } from "@/lib/listing-price-histogram";
import { draftFiltersMatchApplied } from "@/lib/filter-groups";
import { ListingsFilterModalContent } from "@/components/listings/filters/ListingsFilterModalContent";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  draft: ListingsFilterValues;
  applied: ListingsFilterValues;
  rentalType: RentalType;
  priceHistogram: { buckets: PriceHistogramBucket[]; min: number; max: number };
  totalCount: number;
  setDraftField: (name: string, value: string) => void;
  setDraftBoolField: (name: string, checked: boolean) => void;
  onClearDetailed: () => void;
  onApply: () => void;
  buildPreviewQuery: (draft: ListingsFilterValues) => string;
};

function resultLabel(count: number): string {
  if (count === 1) return "ακινήτου";
  return "ακινήτων";
}

export function ListingsFilterModal({
  open,
  onClose,
  draft,
  applied,
  rentalType,
  priceHistogram,
  totalCount,
  setDraftField,
  setDraftBoolField,
  onClearDetailed,
  onApply,
  buildPreviewQuery,
}: Props) {
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasUnsavedChanges = !draftFiltersMatchApplied(draft, applied);
  const displayCount = previewCount ?? totalCount;

  const fetchPreviewCount = useCallback(
    async (values: ListingsFilterValues) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setCountLoading(true);
      try {
        const qs = buildPreviewQuery(values);
        const res = await fetch(`/api/listings/count?${qs}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("count failed");
        const data = (await res.json()) as { count: number };
        setPreviewCount(data.count);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setPreviewCount(null);
        }
      } finally {
        if (!controller.signal.aborted) setCountLoading(false);
      }
    },
    [buildPreviewQuery]
  );

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void fetchPreviewCount(draft);
    }, 280);
    return () => window.clearTimeout(t);
  }, [open, draft, fetchPreviewCount]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleOverlayClick() {
    if (hasUnsavedChanges) return;
    onClose();
  }

  function removeChip(key: string) {
    switch (key) {
      case "price":
        setDraftField("minPriceNight", "");
        setDraftField("maxPriceNight", "");
        setDraftField("minMonthly", "");
        setDraftField("maxMonthly", "");
        break;
      case "bedrooms":
        setDraftField("bedrooms", "");
        break;
      case "bathrooms":
        setDraftField("bathrooms", "");
        break;
      case "type":
        setDraftField("type", "");
        break;
      case "minMonths":
        setDraftField("minMonths", "");
        break;
      case "minSqm":
        setDraftField("minSqm", "");
        break;
      default:
        setDraftBoolField(key, false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listings-filter-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/45 backdrop-blur-[2px]"
        aria-label="Κλείσιμο φίλτρων"
        onClick={handleOverlayClick}
      />

      <div
        className={cn(
          "relative flex w-full flex-col bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]",
          "h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[82vh] sm:max-w-[700px] sm:rounded-[22px]"
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-charcoal/10 px-5 py-4 sm:px-6">
          <h2
            id="listings-filter-modal-title"
            className="font-display text-lg font-semibold text-charcoal sm:text-xl"
          >
            Φίλτρα
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/12 text-charcoal transition-colors hover:bg-charcoal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ListingsFilterModalContent
            draft={draft}
            rentalType={rentalType}
            priceHistogram={priceHistogram}
            setField={setDraftField}
            setBoolField={setDraftBoolField}
            onRemoveChip={removeChip}
          />
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-charcoal/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClearDetailed}
            className="min-h-11 rounded-xl px-2 text-sm font-medium text-charcoal underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Εκκαθάριση όλων
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={countLoading && previewCount === null}
            className="inline-flex min-h-11 min-w-[11rem] items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-70"
          >
            {countLoading && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            Εμφάνιση {displayCount.toLocaleString("el-GR")} {resultLabel(displayCount)}
          </button>
        </footer>
      </div>
    </div>
  );
}
