"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSave: () => void;
};

export function WizardLeaveConfirmModal({
  open,
  busy = false,
  onClose,
  onSaveAndExit,
  onExitWithoutSave,
}: Props) {
  const t = useTranslations("Wizard.leave");
  const tShell = useTranslations("Wizard.shell");
  const titleId = useId();
  const descId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-charcoal/40"
        disabled={busy}
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-[61] w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-lg"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const root = e.currentTarget;
          const focusable = root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-charcoal">
          {t("title")}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-muted">
          {t("body")}
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            ref={primaryRef}
            type="button"
            disabled={busy}
            onClick={onSaveAndExit}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-gold-dark disabled:opacity-60"
          >
            {busy ? tShell("saving") : t("saveAndExit")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onExitWithoutSave}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            {t("exitWithoutSave")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-muted hover:bg-sand/60 hover:text-charcoal disabled:opacity-60"
          >
            {t("keepEditing")}
          </button>
        </div>
      </div>
    </div>
  );
}
