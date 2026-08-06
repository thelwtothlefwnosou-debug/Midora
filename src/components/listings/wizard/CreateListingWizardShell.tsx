"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { cn } from "@/lib/utils";

type Props = {
  stepIndex: number;
  stepCount: number;
  stepLabel: string;
  /** Calm hint under the step title (STEP_HINTS). Hidden during phase intros. */
  stepHint?: string | null;
  phaseLabel?: string;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  error?: string | null;
  children: ReactNode;
  /** Optional live preview — shown on lg+ to the right of the main step content. */
  aside?: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  /** Optional secondary footer action (e.g. continue normally during return-to-review). */
  onSecondaryNext?: () => void;
  secondaryNextLabel?: string;
  onSaveAndExit?: () => void;
  /** Intercept Midora logo navigation (wizard only). */
  onLogoClick?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Calm helper under the primary CTA when disabled (e.g. review incomplete). */
  nextHelper?: string | null;
  showBack?: boolean;
  isLastStep?: boolean;
  busy?: boolean;
  /** When true, hide step chrome title/hint (phase intro supplies its own). */
  phaseIntroMode?: boolean;
  /** Banner above step content (return-to-review mode). */
  fixModeBanner?: string | null;
};

export function CreateListingWizardShell({
  stepIndex,
  stepCount,
  stepLabel,
  stepHint,
  phaseLabel,
  saveStatus = "idle",
  error,
  children,
  aside,
  onBack,
  onNext,
  onSecondaryNext,
  secondaryNextLabel,
  onSaveAndExit,
  onLogoClick,
  nextLabel,
  nextDisabled = false,
  nextHelper = null,
  showBack = true,
  isLastStep = false,
  busy = false,
  phaseIntroMode = false,
  fixModeBanner = null,
}: Props) {
  const t = useTranslations("Wizard.shell");
  const progress = Math.max(4, Math.round(((stepIndex + 1) / stepCount) * 100));
  const layoutMax = aside && !phaseIntroMode ? "max-w-[1100px]" : "max-w-[720px]";
  const chromeMax = aside && !phaseIntroMode ? "max-w-[1100px]" : "max-w-5xl";
  const resolvedNextLabel = nextLabel ?? t("next");

  const saveLabel =
    saveStatus === "saving"
      ? t("saving")
      : saveStatus === "saved"
        ? t("saved")
        : saveStatus === "error"
          ? t("saveFailed")
          : null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white text-charcoal">
      <header className="shrink-0 border-b border-border/70 bg-white/95 backdrop-blur-sm">
        <div
          className={cn(
            "mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6",
            chromeMax
          )}
        >
          {onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              aria-label={t("homeAria")}
            >
              <MidoraLogo size="sm" href={null} />
            </button>
          ) : (
            <MidoraLogo size="sm" href="/dashboard" />
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* When busy, Save&Exit already shows saving — hide status to avoid dual labels. */}
            {saveLabel && !busy && (
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  saveStatus === "error" ? "text-red-600" : "text-muted"
                )}
              >
                {saveLabel}
              </span>
            )}
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-sand/60 hover:text-charcoal"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("help")}</span>
            </Link>
            {onSaveAndExit && (
              <button
                type="button"
                onClick={onSaveAndExit}
                disabled={busy}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-charcoal transition hover:bg-sand/50 disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                {busy ? t("saving") : t("saveAndExit")}
              </button>
            )}
          </div>
        </div>
        <div className="h-1 w-full bg-sand">
          <div
            className="h-full bg-gold transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto w-full px-4 py-10 sm:px-6 sm:py-14",
            layoutMax,
            phaseIntroMode && "sm:py-16"
          )}
        >
          <div className={cn(aside && !phaseIntroMode && "lg:flex lg:items-start lg:gap-12")}>
            <div className="min-w-0 flex-1">
              {!phaseIntroMode && (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                    {phaseLabel ? (
                      <>
                        <span className="text-gold">{phaseLabel}</span>
                        <span className="text-muted"> · </span>
                      </>
                    ) : null}
                    {t("stepOf", { current: stepIndex + 1, total: stepCount })}
                  </p>
                  <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
                    {stepLabel}
                  </h1>
                  {stepHint ? (
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
                      {stepHint}
                    </p>
                  ) : null}
                  {stepIndex === 0 ? (
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-gold-dark/90 sm:text-[15px]">
                      {t("createFreeNote")}
                    </p>
                  ) : null}
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className={cn(
                    "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
                    phaseIntroMode ? "mt-0" : "mt-6"
                  )}
                >
                  {error}
                </div>
              )}

              {fixModeBanner && !phaseIntroMode && (
                <div
                  role="status"
                  className={cn(
                    "rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950",
                    error ? "mt-3" : "mt-6"
                  )}
                >
                  {fixModeBanner}
                </div>
              )}

              <div className={cn(phaseIntroMode ? "mt-0" : "mt-10", "pb-32 sm:pb-28")}>
                {children}
              </div>
            </div>

            {aside && !phaseIntroMode ? (
              <aside className="sticky top-8 hidden w-[280px] shrink-0 lg:block">
                {aside}
              </aside>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-border/70 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4",
            chromeMax
          )}
        >
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              // Never block Back with busy/autosave — only first step has nowhere to go.
              disabled={!phaseIntroMode && stepIndex === 0}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sand/60 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("back")}
            </button>
          ) : (
            <span />
          )}
          {onNext && (
            <div className="flex max-w-full flex-col items-stretch gap-1.5 sm:items-end">
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                {onSecondaryNext && secondaryNextLabel ? (
                  <button
                    type="button"
                    onClick={onSecondaryNext}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {secondaryNextLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onNext}
                  disabled={busy || nextDisabled}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50 sm:px-7",
                    isLastStep && !phaseIntroMode && "bg-charcoal hover:bg-charcoal/90"
                  )}
                >
                  {resolvedNextLabel}
                  {!(isLastStep && !phaseIntroMode) && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
              {nextHelper && nextDisabled && !busy ? (
                <p className="text-right text-xs text-muted sm:max-w-[280px]">
                  {nextHelper}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export function WizardChoiceCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border px-5 py-5 text-left transition sm:px-6 sm:py-6",
        selected
          ? "border-gold bg-gold/5 shadow-[inset_0_0_0_1px_rgba(185,140,90,0.35)]"
          : "border-border bg-white hover:border-gold/40 hover:bg-sand/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-charcoal">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <span
          className={cn(
            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-gold bg-gold text-white" : "border-border"
          )}
          aria-hidden
        >
          {selected ? (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.5 6.5 4.8 8.8 9.5 3.5" />
            </svg>
          ) : null}
        </span>
      </div>
    </button>
  );
}

export function WizardCounter({
  label,
  value,
  min = 0,
  max = 30,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  const t = useTranslations("Wizard.counter");
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border px-4 py-4 sm:px-5">
      <span className="text-sm font-medium text-charcoal sm:text-base">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("decreaseAria", { label })}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg text-charcoal hover:bg-sand/50 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center text-base font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={t("increaseAria", { label })}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg text-charcoal hover:bg-sand/50 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
