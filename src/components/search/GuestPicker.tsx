"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuestCounts = {
  adults: number;
  children: number;
  infants: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: GuestCounts;
  onApply: (value: GuestCounts) => void;
  maxGuests?: number;
  showInfants?: boolean;
};

function clampGuests(value: GuestCounts, maxGuests?: number): GuestCounts {
  const adults = Math.max(1, value.adults);
  const children = Math.max(0, value.children);
  const infants = Math.max(0, value.infants);
  const total = adults + children;
  if (!maxGuests || total <= maxGuests) {
    return { adults, children, infants };
  }
  const overflow = total - maxGuests;
  const nextChildren = Math.max(0, children - overflow);
  return { adults, children: nextChildren, infants };
}

export function formatGuestTileLabel(counts: GuestCounts): string {
  const total = counts.adults + counts.children;
  if (counts.children === 0 && counts.infants === 0) {
    return total === 1 ? "1 επισκέπτης" : `${total} επισκέπτες`;
  }
  const base = total === 1 ? "1 επισκέπτης" : `${total} επισκέπτες`;
  const parts = [base];
  if (counts.children > 0) {
    parts.push(
      counts.children === 1 ? "1 παιδί" : `${counts.children} παιδιά`
    );
  }
  if (counts.infants > 0) {
    parts.push(counts.infants === 1 ? "1 βρέφος" : `${counts.infants} βρέφη`);
  }
  return parts.join(", ");
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
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) return;
    // Sync draft when picker opens (modal remount pattern)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open sync
    setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
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
  }, [onOpenChange, open]);

  function updateDraft(next: GuestCounts) {
    setDraft(clampGuests(next, maxGuests));
  }

  function handleApply() {
    onApply(clampGuests(draft, maxGuests));
    onOpenChange(false);
  }

  const adultsMax = maxGuests
    ? Math.max(1, maxGuests - draft.children)
    : 16;
  const childrenMax = maxGuests ? Math.max(0, maxGuests - draft.adults) : 16;

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-charcoal/20" aria-hidden />
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
        <div className="mt-2 divide-y divide-border">
          <CounterRow
            label="Ενήλικες"
            hint="Ηλικία 13+"
            value={draft.adults}
            min={1}
            max={adultsMax}
            onChange={(adults) => updateDraft({ ...draft, adults })}
          />
          <CounterRow
            label="Παιδιά"
            hint="Ηλικία 2–12"
            value={draft.children}
            min={0}
            max={childrenMax}
            onChange={(children) => updateDraft({ ...draft, children })}
          />
          {showInfants && (
            <CounterRow
              label="Βρέφη"
              hint="Κάτω των 2 ετών"
              value={draft.infants}
              min={0}
              max={5}
              onChange={(infants) => updateDraft({ ...draft, infants })}
            />
          )}
        </div>
        {maxGuests ? (
          <p className="mt-3 text-xs text-muted">Μέγιστοι επισκέπτες αγγελίας: {maxGuests}</p>
        ) : null}
        <button
          type="button"
          onClick={handleApply}
          className="mt-5 min-h-11 w-full rounded-xl bg-gold text-sm font-semibold text-white hover:bg-gold-dark"
        >
          Έτοιμο
        </button>
      </div>
    </div>,
    document.body
  );
}

export function guestCountsToSearchTotal(counts: GuestCounts): number {
  return counts.adults + counts.children;
}

export function parseGuestSearchParam(raw?: string): GuestCounts {
  const total = Math.max(1, parseInt(raw ?? "2", 10) || 2);
  return { adults: total, children: 0, infants: 0 };
}
