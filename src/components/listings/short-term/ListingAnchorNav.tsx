"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const ANCHORS = [
  { id: "gallery", labelKey: "photos" },
  { id: "amenities", labelKey: "amenities" },
  { id: "rules", labelKey: "terms" },
  { id: "area", labelKey: "area" },
] as const;

export function ListingAnchorNav({
  visibleIds,
}: {
  visibleIds: Set<string>;
}) {
  const t = useTranslations("Listing");
  const items = ANCHORS.filter((a) => visibleIds.has(a.id));
  const [active, setActive] = useState(items[0]?.id ?? "");

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
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav className="sticky top-20 z-30 -mx-4 hidden border-b border-border bg-white/95 px-4 backdrop-blur-md lg:block">
      <ul className="flex gap-6 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "inline-flex min-h-11 items-center border-b-2 py-2 font-medium transition-colors",
                active === item.id
                  ? "border-gold text-charcoal"
                  : "border-transparent text-muted hover:text-charcoal"
              )}
            >
              {t(item.labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
