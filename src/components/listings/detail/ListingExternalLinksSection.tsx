"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import {
  externalLinkPublicButtonLabel,
  externalLinksDisclaimer,
  type ListingExternalLink,
} from "@/lib/listing-external-links";

type Props = {
  links: ListingExternalLink[];
};

export function ListingExternalLinksSection({ links }: Props) {
  const t = useTranslations("Legal.shared");
  const locale = useLocale();

  if (!links.length) return null;

  function openExternal(url: string) {
    if (!window.confirm(t("externalLinksLeaveSite"))) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      id="external-links"
      className="listing-section scroll-mt-32 border-t border-charcoal/8 pt-10"
    >
      <h2 className="listing-section-title text-base">
        {t("externalLinksPublicTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {t("externalLinksPublicIntro")} {t("externalLinksNotVerification")}
      </p>

      <div className="mt-4 rounded-xl border border-border bg-sand/15 p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const label =
              link.platform === "other" && link.label
                ? `${externalLinkPublicButtonLabel("other", locale)} (${link.label})`
                : externalLinkPublicButtonLabel(link.platform, locale);

            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => openExternal(link.url)}
                  className="group inline-flex w-full items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-left text-sm font-medium text-charcoal/90 transition-colors hover:border-gold/25 hover:bg-cream"
                >
                  <ExternalLink
                    className="h-4 w-4 shrink-0 text-muted group-hover:text-gold-dark"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs text-muted">{t("externalLinksLeaveSite")}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{externalLinksDisclaimer(locale)}</p>
      </div>
    </section>
  );
}
