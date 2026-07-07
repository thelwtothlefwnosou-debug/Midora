"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizePublicListingText } from "@/lib/listing-public-text";

type Props = {
  description: string;
  descriptionEn?: string | null;
  /** First section after gallery — no top divider */
  lead?: boolean;
};

export function PropertyDescriptionSection({
  description,
  descriptionEn,
  lead = false,
}: Props) {
  const cleanEl = sanitizePublicListingText(description) || description?.trim() || "";
  const cleanEn = sanitizePublicListingText(descriptionEn) || descriptionEn?.trim() || "";
  const hasEn = Boolean(cleanEn);
  const [lang, setLang] = useState<"el" | "en">("el");
  const [expanded, setExpanded] = useState(false);

  const body = lang === "en" && hasEn ? cleanEn : cleanEl;
  if (!body) return null;

  const previewThreshold = 280;
  const isLong = body.length > previewThreshold;

  return (
    <section
      id="about"
      className={cn(
        "listing-section scroll-mt-32",
        lead && "listing-section--lead border-t-0 pt-0"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="listing-section-title">Σχετικά με αυτό το ακίνητο</h2>
        {hasEn && (
          <div className="flex rounded-lg border border-charcoal/10 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang("el")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                lang === "el" ? "bg-sand/60 text-charcoal" : "text-muted hover:text-charcoal"
              )}
            >
              Ελληνικά
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                lang === "en" ? "bg-sand/60 text-charcoal" : "text-muted hover:text-charcoal"
              )}
            >
              English
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 max-w-3xl">
        <p
          className={cn(
            "text-[15px] leading-[1.75] text-charcoal/90 sm:text-base whitespace-pre-wrap",
            isLong && !expanded && "line-clamp-5"
          )}
        >
          {body}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 text-sm font-semibold text-gold-dark transition-colors hover:text-gold"
          >
            {expanded ? "Δες λιγότερα" : "Διάβασε περισσότερα"}
          </button>
        )}
      </div>
    </section>
  );
}
