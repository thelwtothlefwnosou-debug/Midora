"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Hash,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AadeGuideHelperCard } from "@/components/aade/AadeGuideHelperCard";
import { LEGAL_REGISTRY_OPTIONS } from "@/lib/rental-types";
import {
  AADE_SHORT_TERM_REGISTRY_URL,
  normalizeRegistryNumber,
} from "@/lib/registry-compliance";
import { isValidRegistryNumber } from "@/lib/listing-wizard-validation";
import type { LegalRegistryType } from "@/lib/types";

type Props = {
  legalRegistryType: string;
  amaNumber: string;
  onTypeChange: (type: string) => void;
  onNumberChange: (value: string) => void;
  inputClassName: string;
};

export function ShortTermRegistryComplianceCard({
  legalRegistryType,
  amaNumber,
  onTypeChange,
  onNumberChange,
  inputClassName,
}: Props) {
  const t = useTranslations("Wizard.registry");
  const [showInput, setShowInput] = useState(() =>
    Boolean(normalizeRegistryNumber(amaNumber))
  );

  const type = (legalRegistryType || "ama") as LegalRegistryType;
  const normalized = normalizeRegistryNumber(amaNumber);
  const isValid = isValidRegistryNumber(type, normalized);

  function openAadeService() {
    window.open(AADE_SHORT_TERM_REGISTRY_URL, "_blank", "noopener,noreferrer");
    setShowInput(true);
  }

  function typeOptionLabel(value: string) {
    if (value === "ama") return t("typeAma");
    if (value === "esl") return t("typeEsl");
    if (value === "mag") return t("typeMag");
    return value;
  }

  function helperTextForType(value: LegalRegistryType) {
    if (value === "ama") return t("helperAma");
    if (value === "esl") return t("helperEsl");
    if (value === "mag") return t("helperMag");
    return "";
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm">
      <div className="border-b border-gold/15 bg-gradient-to-br from-gold/8 via-white to-ivory/80 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-charcoal sm:text-lg">
              {t("title")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <AadeGuideHelperCard variant="short_term" defaultTab="short_term" />

        {!showInput && !isValid && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="group flex flex-col rounded-2xl border border-border bg-sand/20 p-5 text-left transition-colors hover:border-gold/40 hover:bg-gold/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                <Hash className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-charcoal">{t("haveNumber")}</span>
              <span className="mt-2 text-xs leading-relaxed text-muted">
                {t("haveNumberHint")}
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark">
                {t("addNumber")}
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={openAadeService}
              className="group flex flex-col rounded-2xl border border-border bg-sand/20 p-5 text-left transition-colors hover:border-gold/40 hover:bg-gold/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                <ExternalLink className="h-4 w-4" />
              </div>
              <span className="mt-3 font-semibold text-charcoal">{t("needNumber")}</span>
              <span className="mt-2 text-xs leading-relaxed text-muted">
                {t("needNumberHint")}
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark">
                {t("openAade")}
                <ExternalLink className="h-3 w-3" />
              </span>
            </button>
          </div>
        )}

        {showInput && (
          <div className="space-y-4 rounded-xl border border-border bg-ivory/50 p-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("typeLabel")}
              </span>
              <select
                value={legalRegistryType}
                onChange={(e) => onTypeChange(e.target.value)}
                className={inputClassName}
              >
                {LEGAL_REGISTRY_OPTIONS.filter((o) => o.value !== "none").map((o) => (
                  <option key={o.value} value={o.value}>
                    {typeOptionLabel(o.value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {t("numberLabel")}
              </span>
              <input
                value={amaNumber}
                onChange={(e) => onNumberChange(e.target.value)}
                className={inputClassName}
                inputMode={type === "ama" ? "numeric" : "text"}
                autoComplete="off"
              />
              <span className="mt-1.5 block text-[11px] leading-relaxed text-muted">
                {helperTextForType(type)}
              </span>
            </label>

            {!isValid && normalized.length > 0 && (
              <p className="text-xs text-amber-700">
                {type === "ama" ? t("amaInvalid") : t("numberInvalid")}
              </p>
            )}

            {!isValid && (
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="text-xs font-medium text-muted hover:text-charcoal"
              >
                {t("backToOptions")}
              </button>
            )}
          </div>
        )}

        {isValid && (
          <div className="rounded-xl border border-teal/25 bg-teal/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
              <div>
                <p className="text-sm font-semibold text-charcoal">{t("addedTitle")}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{t("addedBody")}</p>
                <p className="mt-2 text-[11px] font-medium text-teal">
                  {t("statusLabel", { status: t("statusFilled") })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
