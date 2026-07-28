"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OwnerActionItem } from "@/lib/owner-dashboard";
import { cn } from "@/lib/utils";

const toneStyles = {
  red: "border-red-200/80 bg-red-50/40",
  amber: "border-amber-200/80 bg-amber-50/50",
  green: "border-teal/20 bg-teal/5",
  neutral: "border-border bg-white",
};

export function DashboardActionCard({ item }: { item: OwnerActionItem }) {
  const t = useTranslations("Owner.alerts");
  const title = t(item.titleKey, item.titleValues);
  const description = item.descriptionFallback
    ? item.descriptionFallback
    : item.descriptionKey
      ? t(item.descriptionKey, item.descriptionValues)
      : "";
  const cta = t(item.ctaKey);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex flex-col rounded-2xl border p-4 shadow-soft transition-shadow hover:shadow-card sm:p-5",
        toneStyles[item.tone]
      )}
    >
      <h3 className="font-display text-base font-semibold text-charcoal">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold group-hover:gap-2 transition-all">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
