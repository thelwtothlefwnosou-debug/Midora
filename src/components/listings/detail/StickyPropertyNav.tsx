"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type NavItem = { id: string; label: string };

export function StickyPropertyNav({ items }: { items: NavItem[] }) {
  const t = useTranslations("Listing.stickyNav");
  const [active, setActive] = useState(items[0]?.id ?? "about");

  useEffect(() => {
    if (!items.length) return;

    const observers: IntersectionObserver[] = [];
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(item.id);
        },
        { rootMargin: "-28% 0px -58% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav
      className="sticky top-[4.25rem] z-30 -mx-4 border-b border-charcoal/8 bg-white/95 backdrop-blur-md sm:-mx-6"
      aria-label={t("ariaLabel")}
    >
      <ul className="flex gap-1 overflow-x-auto px-4 sm:gap-2 sm:px-6">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className={cn(
                "inline-flex min-h-11 items-center border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active === item.id
                  ? "border-gold text-charcoal"
                  : "border-transparent text-charcoal/55 hover:text-charcoal"
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
