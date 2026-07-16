"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
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

export function formatGuestTileLabel(counts: GuestCounts): string {
  const total = counts.adults + counts.children;
  const parts: string[] = [];

  if (total > 0) {
    parts.push(total === 1 ? "1 επισκέπτης" : `${total} επισκέπτες`);
  }

  if (counts.pets > 0) {
    parts.push(counts.pets === 1 ? "1 κατοικίδιο" : `${counts.pets} κατοικίδια`);
  }

  if (counts.children > 0 && total > 0) {
    const childPart =
      counts.children === 1 ? "1 παιδί" : `${counts.children} παιδιά`;
    if (!parts.some((p) => p.includes("επισκέπ"))) {
      parts.unshift(childPart);
    }
  }

  if (counts.infants > 0) {
    parts.push(counts.infants === 1 ? "1 βρέφος" : `${counts.infants} βρέφη`);
  }

  return parts.length ? parts.join(", ") : "Επισκέπτες";
}

function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
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
          aria-label={`Μείωση ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:border-gold/35 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-charcoal">{value}</span>
        <button
          type="button"
          aria-label={`Αύξηση ${label}`}
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
          label="Ενήλικες"
          hint="Ηλικία 13+"
          value={draft.adults}
          min={adultsMin}
          max={adultsMax}
          onChange={(adults) => updateDraft({ ...draft, adults })}
        />
        <CounterRow
          label="Παιδιά"
          hint="Ηλικίες 2–12"
          value={draft.children}
          min={0}
          max={childrenMax}
          onChange={(children) => updateDraft({ ...draft, children })}
        />
        {showInfants && (
          <CounterRow
            label="Βρέφη"
            hint="Κάτω των 2"
            value={draft.infants}
            min={0}
            max={5}
            onChange={(infants) => updateDraft({ ...draft, infants })}
          />
        )}
        <CounterRow
          label="Κατοικίδια"
          hint="Φέρνεις κατοικίδιο;"
          value={draft.pets}
          min={0}
          max={5}
          onChange={(pets) => updateDraft({ ...draft, pets })}
        />
      </div>
      {maxGuests ? (
        <p className="mt-3 text-xs text-muted">Μέγιστοι επισκέπτες αγγελίας: {maxGuests}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="min-h-10 flex-1 rounded-xl border border-border px-4 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5"
        >
          Καθαρισμός
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="min-h-10 flex-1 rounded-xl bg-gold text-sm font-semibold text-white hover:bg-gold-dark"
        >
          Έτοιμο
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
          Επισκέπτες
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
          Επισκέπτες
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
