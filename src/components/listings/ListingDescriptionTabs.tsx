"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizePublicListingText } from "@/lib/listing-public-text";

type Props = {
  descriptionEl: string;
  descriptionEn?: string | null;
};

export function ListingDescriptionTabs({
  descriptionEl,
  descriptionEn,
}: Props) {
  const [lang, setLang] = useState<"el" | "en">("el");
  const cleanEl = sanitizePublicListingText(descriptionEl);
  const cleanEn = sanitizePublicListingText(descriptionEn);
  const hasEn = Boolean(cleanEn);
  const body = lang === "en" && hasEn ? cleanEn : cleanEl;

  if (!body) return null;

  return (
    <div className="listing-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="listing-section-title">Περιγραφή</h2>
        {hasEn && (
          <div className="flex rounded-lg border border-border bg-white p-0.5 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setLang("el")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                lang === "el"
                  ? "bg-white text-charcoal shadow-soft"
                  : "text-muted hover:text-charcoal"
              )}
            >
              Ελληνικά
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                lang === "en"
                  ? "bg-white text-charcoal shadow-soft"
                  : "text-muted hover:text-charcoal"
              )}
            >
              Αγγλικά
            </button>
          </div>
        )}
      </div>
      <p className="listing-body mt-5 whitespace-pre-wrap">{body}</p>
      {lang === "en" && !hasEn && (
        <p className="mt-2 text-sm text-muted">
          Η αγγλική περιγραφή δεν είναι διαθέσιμη ακόμα.
        </p>
      )}
    </div>
  );
}
