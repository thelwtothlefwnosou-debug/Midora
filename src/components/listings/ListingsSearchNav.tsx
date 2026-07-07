"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Ακίνητα", href: "/listings" },
  { label: "Πώς λειτουργεί", href: "/how-it-works" },
  { label: "Για ιδιοκτήτες", href: "/owners" },
  { label: "Αγαπημένα", href: "/dashboard/favorites" },
] as const;

export function ListingsSearchNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "hidden items-center justify-center gap-7 md:flex lg:gap-9",
        className
      )}
      aria-label="Κύρια πλοήγηση"
    >
      {LINKS.map((link) => {
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
