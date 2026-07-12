"use client";

import { ExternalLink } from "lucide-react";
import {
  EXTERNAL_LINKS_DISCLAIMER,
  EXTERNAL_LINK_PUBLIC_BUTTON_LABELS,
  EXTERNAL_LINK_PLATFORM_LABELS,
  type ListingExternalLink,
} from "@/lib/listing-external-links";

type Props = {
  links: ListingExternalLink[];
};

function openExternal(url: string) {
  if (!window.confirm("Θα μεταφερθείς εκτός Midora.")) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ListingExternalLinksSection({ links }: Props) {
  if (!links.length) return null;

  return (
    <section
      id="external-links"
      className="listing-section scroll-mt-32 border-t border-charcoal/8 pt-10"
    >
      <h2 className="listing-section-title text-base">Σύνδεσμοι σε άλλες πλατφόρμες</h2>
      <p className="mt-2 text-sm text-muted">
        Ο ιδιοκτήτης έχει προσθέσει εξωτερικό σύνδεσμο για αυτή την αγγελία.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-sand/15 p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const label =
              link.platform === "other" && link.label
                ? `${EXTERNAL_LINK_PUBLIC_BUTTON_LABELS.other} (${link.label})`
                : EXTERNAL_LINK_PUBLIC_BUTTON_LABELS[link.platform];

            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => openExternal(link.url)}
                  className="group inline-flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-left text-sm font-medium text-charcoal transition-colors hover:border-gold/30 hover:bg-cream"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ExternalLink
                      className="h-4 w-4 shrink-0 text-muted group-hover:text-gold-dark"
                      aria-hidden
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">
                    {EXTERNAL_LINK_PLATFORM_LABELS[link.platform]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs text-muted">Θα μεταφερθείς εκτός Midora.</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{EXTERNAL_LINKS_DISCLAIMER}</p>
      </div>
    </section>
  );
}
