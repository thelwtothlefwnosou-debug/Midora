"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

/**
 * Compact footer for public search/results — not the full homepage footer.
 */
export function SearchPageFooter() {
  const t = useTranslations("Footer");
  const tSearch = useTranslations("Listings.searchFooter");
  const year = new Date().getFullYear();

  const links = [
    { label: t("help"), href: "/help" },
    { label: t("faq"), href: "/faq" },
    { label: t("terms"), href: "/terms" },
    { label: t("privacy"), href: "/privacy" },
    { label: t("contact"), href: "/contact" },
  ] as const;

  return (
    <footer className="border-t border-charcoal/10 bg-[#faf9f7] pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-8 sm:pb-10 sm:pt-9">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-xl">
            <MidoraLogo href="/" variant="default" size="sm" />
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {tSearch("roleStatement")}
            </p>
          </div>
          <div className="shrink-0 sm:pt-1">
            <LanguageSwitcher compact />
          </div>
        </div>

        <nav
          aria-label={t("columnsAria")}
          className="flex flex-wrap gap-x-5 gap-y-2.5 border-t border-charcoal/8 pt-5"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-charcoal/80 transition hover:text-charcoal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-[12px] text-muted/80">{t("rights", { year })}</p>
      </div>
    </footer>
  );
}
