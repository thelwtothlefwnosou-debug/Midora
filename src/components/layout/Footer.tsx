"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { FooterBugReport } from "@/components/feedback/FooterBugReport";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

type FooterLink = { label: string; href: string };

type FooterColumn = {
  id: string;
  title: string;
  links: FooterLink[];
  action?: ReactNode;
};

const SOCIAL_LINKS = [
  {
    key: "instagram",
    label: "Instagram",
    href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || "",
  },
  {
    key: "facebook",
    label: "Facebook",
    href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() || "",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() || "",
  },
].filter((item) => item.href.length > 0);

function FooterNavColumn({
  column,
  open,
  onToggle,
}: {
  column: FooterColumn;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Footer");
  const panelId = useId();

  return (
    <div className="site-footer-col border-b border-charcoal/10 py-1 md:border-0 md:py-0">
      <button
        type="button"
        className="site-footer-col-toggle flex w-full items-center justify-between gap-3 py-3.5 text-left md:pointer-events-none md:cursor-default md:py-0"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="site-footer-col-title">{column.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted/70 transition-transform duration-300 md:hidden",
            open && "rotate-180"
          )}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="sr-only md:hidden">
          {t("navGroupToggle", { title: column.title })}
        </span>
      </button>

      <div
        id={panelId}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 md:grid md:grid-rows-[1fr]",
          open ? "grid-rows-[1fr] pb-3.5 md:pb-0" : "grid-rows-[0fr] md:pb-0"
        )}
      >
        <ul className="min-h-0 space-y-3 overflow-hidden md:mt-5 md:space-y-3.5">
          {column.links.map((link) => (
            <li key={`${column.id}-${link.href}-${link.label}`}>
              <Link href={link.href} className="site-footer-link">
                {link.label}
              </Link>
            </li>
          ))}
          {column.action ? <li>{column.action}</li> : null}
        </ul>
      </div>
    </div>
  );
}

function SocialIcon({ name }: { name: string }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3.75" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M14.5 8.5V7.2c0-.7.4-1.2 1.3-1.2H17V3.5h-2.2C12.3 3.5 11 5 11 7.1v1.4H9V11h2v9.5h3.5V11H17l.5-2.5h-3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M6.3 9.2v9.1H3.2V9.2h3.1zM4.75 4.4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM20.8 18.3v-5c0-2.7-1.4-3.9-3.4-3.9-1.6 0-2.3.9-2.7 1.5v-1.3h-3.1c0 .8 0 9.1 0 9.1h3.1v-5.1c0-.3 0-.5.1-.7.2-.5.7-1 1.5-1 1.1 0 1.5.8 1.5 2v3.8h3z" />
    </svg>
  );
}

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();
  const [openCol, setOpenCol] = useState<string | null>(null);

  const columns: FooterColumn[] = [
    {
      id: "midora",
      title: t("midora"),
      links: [
        { label: t("home"), href: "/" },
        { label: t("howItWorks"), href: "/how-it-works" },
        { label: t("searchListings"), href: "/listings?rentalType=short_term" },
        { label: t("forOwners"), href: "/owners" },
        { label: t("publishListing"), href: OWNER_LISTING_NEW_PATH },
      ],
    },
    {
      id: "properties",
      title: t("properties"),
      links: [
        { label: t("shortTerm"), href: "/listings?rentalType=short_term" },
        { label: t("monthly"), href: "/listings?rentalType=monthly" },
        { label: t("furnished"), href: "/listings?furnished=true" },
        { label: t("pets"), href: "/listings?pets=true" },
        { label: t("popularSearches"), href: "/#areas" },
      ],
    },
    {
      id: "support",
      title: t("support"),
      links: [
        { label: t("help"), href: "/help" },
        { label: t("faq"), href: "/faq" },
        { label: t("contact"), href: "/contact" },
        { label: t("reportListing"), href: "/help#report" },
        { label: t("communicationSafety"), href: "/help#safety" },
      ],
      action: <FooterBugReport />,
    },
    {
      id: "legal",
      title: t("legal"),
      links: [
        { label: t("terms"), href: "/terms" },
        { label: t("privacy"), href: "/privacy" },
        { label: t("cookies"), href: "/privacy#cookies" },
        { label: t("listingRules"), href: "/listing-rules" },
        { label: t("midoraRole"), href: "/terms#role" },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand min-w-0">
            <MidoraLogo href="/" variant="default" size="2xl" className="site-footer-logo" />
            <p className="site-footer-brand-copy">{t("brandLead")}</p>
          </div>

          <div className="site-footer-updates">
            <p className="site-footer-updates-title">{t("updatesTitle")}</p>
            <p className="site-footer-updates-text">{t("updatesHelper")}</p>
            <Link href="/contact" className="site-footer-updates-cta">
              {t("updatesCta")}
            </Link>
          </div>
        </div>

        <nav aria-label={t("columnsAria")} className="site-footer-columns">
          {columns.map((column) => (
            <FooterNavColumn
              key={column.id}
              column={column}
              open={openCol === column.id}
              onToggle={() =>
                setOpenCol((current) => (current === column.id ? null : column.id))
              }
            />
          ))}
        </nav>

        <div className="site-footer-bottom">
          <div className="site-footer-bottom-left">
            {SOCIAL_LINKS.length > 0 ? (
              <ul className="flex items-center gap-2" aria-label={t("socialAria")}>
                {SOCIAL_LINKS.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="site-footer-social"
                      aria-label={item.label}
                    >
                      <SocialIcon name={item.key} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <LanguageSwitcher compact={false} className="site-footer-lang" />
          </div>

          <p className="site-footer-role">{t("roleStatement")}</p>

          <div className="site-footer-meta">
            <p className="site-footer-copyright">{t("rights", { year })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
