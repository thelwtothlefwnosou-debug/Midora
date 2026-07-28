"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "type">;

function openMonthPicker(el: HTMLInputElement | null) {
  if (!el) return;
  el.focus();
  try {
    el.showPicker?.();
  } catch {
    /* unsupported browsers fall back to native focus */
  }
}

/**
 * HTML month input that opens the native picker on click anywhere
 * (not only the far-right calendar icon in Chromium).
 */
export const MonthInput = forwardRef<HTMLInputElement, Props>(
  function MonthInput({ className, onClick, ...props }, ref) {
    return (
      <input
        {...props}
        ref={ref}
        type="month"
        className={cn("cursor-pointer", className)}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          openMonthPicker(e.currentTarget);
        }}
      />
    );
  }
);
