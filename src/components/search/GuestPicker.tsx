"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchFieldPopover } from "@/components/search/SearchFieldPopover";
import { cn } from "@/lib/utils";

export type GuestCounts = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

export const EMPTY_GUEST_COUNTS: GuestCounts = {
  adults: 0,
  children: 0,
  infants: 0,
  pets: 0,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: GuestCounts;
  onApply: (value: GuestCounts) => void;
  maxGuests?: number;
  showInfants?: boolean;
  presentation?: "modal" | "popover";
  anchorRef?: React.RefObject<HTMLElement | null>;
  ignoreRefs?: React.RefObject<HTMLElement | null>[];
  onClear?: () => void;
};

export function hasGuestOrPetSelection(counts: GuestCounts): boolean {
  return (
    counts.adults + counts.children > 0 ||
    counts.infants > 0 ||
    counts.pets > 0
  );
}

function clampGuests(value: GuestCounts, maxGuests?: number): GuestCounts {
  let adults = Math.max(0, value.adults);
  const children = Math.max(0, value.children);
  const infants = Math.max(0, value.infants);
  const pets = Math.max(0, value.pets);
  const guestTotal = adults + children;

  if (guestTotal > 0 && adults < 1) {
    adults = 1;
  }

  if (!maxGuests) {
    return {
      adults: Math.min(adults, 16),
      children: Math.min(children, 16),
      infants: Math.min(infants, 5),
      pets: Math.min(pets, 5),
    };
  }

  if (guestTotal <= maxGuests) {
    return { adults, children, infants, pets };
  }

  const overflow = guestTotal - maxGuests;
  const nextChildren = Math.max(0, children - overflow);
  return { adults, children: nextChildren, infants, pets };
}

export type GuestTileLabels = {
  guestOne: string;
  guestOther: string;
  petOne: string;
  petOther: string;
  childOne: string;
  childOther: string;
  infantOne: string;
  infantOther: string;
  fallback: string;
};

const DEFAULT_GUEST_TILE_LABELS: GuestTileLabels = {
  guestOne: "guest",
  guestOther: "guests",
  petOne: "pet",
  petOther: "pets",
  childOne: "child",
  childOther: "children",
  infantOne: "infant",
  infantOther: "infants",
  fallback: "Guests",
};

export function guestTileLabelsFromTranslations(
  t: (key: string) => string
): GuestTileLabels {
  return {
    guestOne: t("guestOne"),
    guestOther: t("guestOther"),
    petOne: t("petOne"),
    petOther: t("petOther"),
    childOne: t("childOne"),
    childOther: t("childOther"),
    infantOne: t("infantOne"),
    infantOther: t("infantOther"),
    fallback: t("fallback"),
  };
}

export function formatGuestTileLabel(
  counts: GuestCounts,
  labels: GuestTileLabels = DEFAULT_GUEST_TILE_LABELS
): string {
  const total = counts.adults + counts.children;
  const parts: string[] = [];
  let hasGuestPart = false;

  if (total > 0) {
    parts.push(`${total} ${total === 1 ? labels.guestOne : labels.guestOther}`);
    hasGuestPart = true;
  }

  if (counts.pets > 0) {
    parts.push(`${counts.pets} ${counts.pets === 1 ? labels.petOne : labels.petOther}`);
  }

  if (counts.children > 0 && total > 0 && !hasGuestPart) {
    const childPart = `${counts.children} ${
      counts.children === 1 ? labels.childOne : labels.childOther
    }`;
    parts.unshift(childPart);
  }

  if (counts.infants > 0) {
    parts.push(`${counts.infants} ${counts.infants === 1 ? labels.infantOne : labels.infantOther}`);
  }

  return parts.length ? parts.join(", ") : labels.fallback;
}

function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-gold/35 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-charcoal">{value}</span>
        <button
          type="button"
          aria-label={increaseLabel}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-gold/35 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function GuestPicker({
  open,
  onOpenChange,
  value,
  onApply,
  maxGuests,
  showInfants = true,
  presentation = "modal",
  anchorRef,
  ignoreRefs,
  onClear,
}: Props) {
  const t = useTranslations("Search.guestPicker");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync on open
    setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open || presentation === "popover") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [onOpenChange, open, presentation]);

  function updateDraft(next: GuestCounts) {
    setDraft(clampGuests(next, maxGuests));
  }

  function handleApply() {
    onApply(clampGuests(draft, maxGuests));
    onOpenChange(false);
  }

  function handleClear() {
    const cleared = { ...EMPTY_GUEST_COUNTS };
    setDraft(cleared);
    onClear?.();
    onApply(cleared);
    onOpenChange(false);
  }

  const guestTotal = draft.adults + draft.children;
  const adultsMin = guestTotal > 0 || draft.infants > 0 ? 1 : 0;
  const adultsMax = maxGuests
    ? Math.max(adultsMin, maxGuests - draft.children)
    : 16;
  const childrenMax = maxGuests ? Math.max(0, maxGuests - draft.adults) : 16;

  const panelBody = (
    <>
      <div className="divide-y divide-border">
        <CounterRow
          label={t("adults")}
          hint={t("adultsHint")}
          value={draft.adults}
          min={adultsMin}
          max={adultsMax}
          onChange={(adults) => updateDraft({ ...draft, adults })}
          decreaseLabel={t("decrease", { label: t("adults") })}
          increaseLabel={t("increase", { label: t("adults") })}
        />
        <CounterRow
          label={t("children")}
          hint={t("childrenHint")}
          value={draft.children}
          min={0}
          max={childrenMax}
          onChange={(children) => updateDraft({ ...draft, children })}
          decreaseLabel={t("decrease", { label: t("children") })}
          increaseLabel={t("increase", { label: t("children") })}
        />
        {showInfants && (
          <CounterRow
            label={t("infants")}
            hint={t("infantsHint")}
            value={draft.infants}
            min={0}
            max={5}
            onChange={(infants) => updateDraft({ ...draft, infants })}
            decreaseLabel={t("decrease", { label: t("infants") })}
            increaseLabel={t("increase", { label: t("infants") })}
          />
        )}
        <CounterRow
          label={t("pets")}
          hint={t("petsHint")}
          value={draft.pets}
          min={0}
          max={5}
          onChange={(pets) => updateDraft({ ...draft, pets })}
          decreaseLabel={t("decrease", { label: t("pets") })}
          increaseLabel={t("increase", { label: t("pets") })}
        />
      </div>
      {maxGuests ? (
        <p className="mt-3 text-xs text-muted">{t("maxGuestsNote", { max: maxGuests })}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="min-h-10 flex-1 rounded-xl border border-border px-4 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5"
        >
          {t("clear")}
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="min-h-10 flex-1 rounded-xl bg-gold text-sm font-semibold text-white hover:bg-gold-dark"
        >
          {t("done")}
        </button>
      </div>
    </>
  );

  if (!open) return null;

  if (presentation === "popover") {
    return (
      <SearchFieldPopover
        open={open}
        onOpenChange={onOpenChange}
        anchorRef={anchorRef}
        ignoreRefs={ignoreRefs}
        placement="below-anchor"
        preferredWidth={400}
        panelClassName="max-w-[min(400px,calc(100vw-48px))]"
        scrim
        className="px-5 py-3"
      >
        <p id={titleId} className="sr-only">
          {t("title")}
        </p>
        {panelBody}
      </SearchFieldPopover>
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-charcoal/20"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative w-full max-w-sm rounded-t-[20px] border border-border bg-white p-5 shadow-float sm:rounded-2xl"
        )}
      >
        <h3 id={titleId} className="font-display text-lg font-semibold text-charcoal">
          {t("title")}
        </h3>
        <div className="mt-2">{panelBody}</div>
      </div>
    </div>,
    document.body
  );
}

export function guestCountsToSearchTotal(counts: GuestCounts): number {
  return counts.adults + counts.children;
}

export function parseGuestSearchParam(
  guestsRaw?: string,
  petsRaw?: string
): { counts: GuestCounts; hasSelection: boolean } {
  const total = parseInt(guestsRaw ?? "", 10);
  const pets = parsePetsSearchParam(petsRaw);
  const guestsNum = Number.isFinite(total) && total > 0 ? total : 0;

  if (guestsNum <= 0 && pets <= 0) {
    return { counts: { ...EMPTY_GUEST_COUNTS }, hasSelection: false };
  }

  return {
    counts: {
      adults: guestsNum > 0 ? guestsNum : 0,
      children: 0,
      infants: 0,
      pets,
    },
    hasSelection: true,
  };
}

function parsePetsSearchParam(raw?: string): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
