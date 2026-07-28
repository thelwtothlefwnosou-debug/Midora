"use client";

import { cn } from "@/lib/utils";

const heroTileClass =
  "home-hero-search-cell home-search-field relative w-full text-left transition-colors hover:bg-[#faf6ef]";

const heroTileActiveClass =
  "z-[1] bg-[#f7f0e6] ring-1 ring-inset ring-gold/55";

type Props = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  as?: "button" | "div";
};

/** Full-area clickable search tile with premium active state. */
export function SearchInteractiveTile({
  active = false,
  onClick,
  className,
  children,
  as = "button",
}: Props) {
  const classes = cn(
    heroTileClass,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-1",
    active && heroTileActiveClass,
    className
  );

  if (as === "div") {
    return <div className={classes}>{children}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

type HeroSearchFieldProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  fieldId: string;
  children: React.ReactNode;
  className?: string;
  /** Opens native picker when clicking the tile padding (select / month). */
  openPicker?: boolean;
};

/** Hero search cell — click anywhere on the tile to focus the inner control. */
export function HeroSearchField({
  icon: Icon,
  label,
  fieldId,
  children,
  className,
  openPicker = false,
}: HeroSearchFieldProps) {
  function focusControl(openNativePicker: boolean) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.focus();
    if (openNativePicker) {
      try {
        (el as HTMLInputElement).showPicker?.();
      } catch {
        /* unsupported */
      }
    }
  }

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        heroTileClass,
        "cursor-text focus-within:z-[1] focus-within:bg-[#f7f0e6] focus-within:ring-1 focus-within:ring-inset focus-within:ring-gold/55",
        openPicker && "cursor-pointer",
        className
      )}
      onMouseDown={(e) => {
        const el = document.getElementById(fieldId) as
          | HTMLInputElement
          | HTMLSelectElement
          | null;
        if (!el) return;

        const clickedControl = e.target === el || el.contains(e.target as Node);

        if (!openPicker) {
          if (clickedControl) return;
          e.preventDefault();
          focusControl(false);
          return;
        }

        // Select: native open works when clicking the control itself.
        if (el instanceof HTMLSelectElement) {
          if (clickedControl) return;
          e.preventDefault();
          focusControl(true);
          return;
        }

        // Month/date inputs: Chromium only opens from the icon — force full-area open.
        e.preventDefault();
        focusControl(true);
      }}
    >
      <Icon
        className="pointer-events-none h-[18px] w-[18px] shrink-0 text-gold/85"
        strokeWidth={1.75}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="home-search-field-label pointer-events-none">{label}</span>
        <div className="min-w-0">{children}</div>
      </div>
    </label>
  );
}
