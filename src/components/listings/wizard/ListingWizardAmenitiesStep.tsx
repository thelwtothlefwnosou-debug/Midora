"use client";

import { createElement, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  catalogForRentalMode,
  isKnownAmenityKey,
  normalizeAmenityKey,
  popularFilterAmenities,
} from "@/lib/amenities-catalog";
import { getAmenityLabel } from "@/lib/amenities-i18n";
import {
  WIZARD_AMENITY_SECTIONS,
  type WizardAmenitySection,
  type WizardAmenitySectionId,
} from "@/lib/amenities-wizard-groups";
import { amenityIconForKey } from "@/lib/amenity-icons";
import { cn } from "@/lib/utils";

type Props = {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  onSkip: () => void;
  /** Matches listing rental mode so monthly gets furnished/bills populars. */
  rentalMode?: "short_term" | "monthly";
};

function AmenityChip({
  amenityKey,
  active,
  onToggle,
  label,
}: {
  amenityKey: string;
  active: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-gold bg-gold/15 text-gold-dark"
          : "border-charcoal/12 bg-white text-charcoal hover:border-gold/35"
      )}
    >
      {active ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        createElement(amenityIconForKey(amenityKey), {
          className: "h-3.5 w-3.5 shrink-0 text-muted",
          "aria-hidden": true,
        })
      )}
      {label}
    </button>
  );
}

function AmenityCheckRow({
  amenityKey,
  active,
  onToggle,
  label,
}: {
  amenityKey: string;
  active: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        active
          ? "border-gold/35 bg-gold/8 text-charcoal"
          : "border-transparent hover:bg-charcoal/[0.03]"
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={active}
        onChange={onToggle}
      />
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
          active ? "border-gold bg-gold text-white" : "border-charcoal/20 bg-white"
        )}
      >
        {active ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  );
}

function sectionsForMode(rentalMode: "short_term" | "monthly"): WizardAmenitySection[] {
  const allowed = new Set(
    catalogForRentalMode(rentalMode).map((def) => normalizeAmenityKey(def.key))
  );
  return WIZARD_AMENITY_SECTIONS.map((section) => ({
    ...section,
    keys: section.keys.filter((key) => allowed.has(normalizeAmenityKey(key))),
  })).filter((section) => section.keys.length > 0);
}

export function ListingWizardAmenitiesStep({
  selectedKeys,
  onChange,
  onSkip,
  rentalMode = "short_term",
}: Props) {
  const t = useTranslations("Wizard.amenities");
  const tAmenities = useTranslations("Amenities");
  const [query, setQuery] = useState("");

  const labelFor = (key: string) => getAmenityLabel(key, tAmenities);
  const sectionLabel = (id: WizardAmenitySectionId) => t(`sections.${id}`);

  const selectedSet = useMemo(
    () => new Set(selectedKeys.map(normalizeAmenityKey)),
    [selectedKeys]
  );

  const popularKeys = useMemo(
    () => popularFilterAmenities(rentalMode).map((def) => def.key),
    [rentalMode]
  );

  const modeSections = useMemo(() => sectionsForMode(rentalMode), [rentalMode]);

  const normalizedQuery = query.trim().toLowerCase();

  const visibleSections = useMemo(() => {
    if (!normalizedQuery) return modeSections;
    return modeSections
      .map((section) => ({
        ...section,
        keys: section.keys.filter((key) =>
          labelFor(key).toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((section) => section.keys.length > 0);
  }, [modeSections, normalizedQuery, tAmenities]);

  function toggleKey(key: string) {
    const normalized = normalizeAmenityKey(key);
    if (!isKnownAmenityKey(normalized)) return;
    const next = new Set(selectedSet);
    if (next.has(normalized)) next.delete(normalized);
    else next.add(normalized);
    onChange([...next]);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">{t("intro")}</p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm text-charcoal outline-none focus:border-gold/50"
        />
      </div>

      {!normalizedQuery && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("popular")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popularKeys.length > 0 ? (
              popularKeys.map((key) => (
                <AmenityChip
                  key={key}
                  amenityKey={key}
                  label={labelFor(key)}
                  active={selectedSet.has(normalizeAmenityKey(key))}
                  onToggle={() => toggleKey(key)}
                />
              ))
            ) : (
              <p className="text-sm text-muted">{t("popularEmpty")}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("all")}
        </p>
        {visibleSections.length === 0 ? (
          <p className="text-sm text-muted">{t("noneFound")}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {visibleSections.map((section) => (
              <div
                key={section.id}
                className="overflow-hidden rounded-2xl border border-border bg-white"
              >
                <div className="border-b border-border/70 px-4 py-3">
                  <p className="text-sm font-semibold text-charcoal">
                    {sectionLabel(section.id)}
                    <span className="ml-2 font-normal text-muted">
                      ({section.keys.length})
                    </span>
                  </p>
                </div>
                <div className="grid gap-1 px-2 py-2 sm:grid-cols-1">
                  {section.keys.map((key) => (
                    <AmenityCheckRow
                      key={key}
                      amenityKey={key}
                      label={labelFor(key)}
                      active={selectedSet.has(normalizeAmenityKey(key))}
                      onToggle={() => toggleKey(key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedKeys.length > 0 && (
        <p className="text-xs text-muted">
          {t("selectedCount", { count: selectedKeys.length })}
        </p>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="text-sm font-medium text-muted underline-offset-2 hover:text-charcoal hover:underline"
      >
        {t("skipForNow")}
      </button>
    </div>
  );
}
