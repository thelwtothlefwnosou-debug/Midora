"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  children: ReactNode;
  footer: ReactNode;
  /** Extra classes for the dialog panel */
  className?: string;
  /** Max width token — default max-w-lg */
  size?: "md" | "lg";
};

/**
 * Centered modal portaled to document.body so overflow/transform ancestors
 * cannot clip it. Sticky footer stays visible while body scrolls.
 */
export function PortalModal({
  open,
  onClose,
  title,
  titleId = "portal-modal-title",
  children,
  footer,
  className,
  size = "md",
}: Props) {
  const t = useTranslations("Common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-charcoal/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] flex w-full max-h-[min(90dvh,720px)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl",
          size === "lg" ? "max-w-xl" : "max-w-lg",
          className
        )}
      >
        <div className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <h3
            id={titleId}
            className="font-display text-lg font-semibold text-charcoal"
          >
            {title}
          </h3>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        <div className="shrink-0 border-t border-border bg-white px-5 py-3 sm:px-6">
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}
