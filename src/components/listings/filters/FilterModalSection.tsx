"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  defaultOpen?: boolean;
  activeCount?: number;
  children: React.ReactNode;
};

export function FilterModalSection({
  title,
  defaultOpen = true,
  activeCount = 0,
  children,
}: Props) {
  return (
    <details
      className="group border-b border-charcoal/8 last:border-b-0"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-base font-semibold text-charcoal">
          {title}
          {activeCount > 0 && (
            <span className="ml-1.5 font-sans text-sm font-medium text-muted">
              · {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

export function FilterDivider() {
  return <div className="my-1 h-px bg-charcoal/8" aria-hidden />;
}

type StepperProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowHalf?: boolean;
};

export function FilterStepperRow({
  label,
  value,
  onChange,
  allowHalf = false,
}: StepperProps) {
  const tf = useTranslations("Listings.filter");
  const numeric = value ? parseFloat(value) : 0;

  const display =
    numeric <= 0
      ? tf("any")
      : allowHalf && numeric % 1 !== 0
        ? `${numeric}+`
        : `${Math.floor(numeric)}+`;

  function step(delta: number) {
    if (delta < 0) {
      if (allowHalf) {
        if (numeric <= 1) onChange("");
        else if (numeric === 1.5) onChange("1");
        else if (numeric === 2) onChange("1.5");
        else onChange(String(numeric - 1));
      } else {
        if (numeric <= 1) onChange("");
        else onChange(String(numeric - 1));
      }
      return;
    }
    if (allowHalf) {
      if (numeric <= 0) onChange("1");
      else if (numeric === 1) onChange("1.5");
      else if (numeric === 1.5) onChange("2");
      else onChange(String(numeric + 1));
    } else {
      onChange(String(Math.max(1, numeric + 1)));
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-charcoal">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={numeric <= 0}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 text-lg text-charcoal transition-colors",
            numeric <= 0
              ? "cursor-not-allowed opacity-40"
              : "hover:border-gold/40 hover:bg-sand/50"
          )}
          aria-label={tf("decreaseAria", { label })}
        >
          −
        </button>
        <span className="min-w-[7rem] text-center text-sm text-charcoal">{display}</span>
        <button
          type="button"
          onClick={() => step(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 text-lg text-charcoal transition-colors hover:border-gold/40 hover:bg-sand/50"
          aria-label={tf("increaseAria", { label })}
        >
          +
        </button>
      </div>
    </div>
  );
}
