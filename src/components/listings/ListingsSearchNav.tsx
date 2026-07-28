"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LINK_DEFS = [
  { key: "listings" as const, href: "/listings" },
  { key: "howItWorks" as const, href: "/how-it-works" },
  { key: "forOwners" as const, href: "/owners" },
  { key: "favorites" as const, href: "/dashboard/favorites" },
];

export function ListingsSearchNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <nav
      className={cn(
        "hidden items-center justify-center gap-7 md:flex lg:gap-9",
        className
      )}
      aria-label={t("ariaMain")}
    >
      {LINK_DEFS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "listings-search-nav-link relative pb-0.5 text-sm transition-colors",
              active
                ? "font-medium text-charcoal"
                : "font-normal text-charcoal/55 hover:text-charcoal"
            )}
            aria-current={active ? "page" : undefined}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
