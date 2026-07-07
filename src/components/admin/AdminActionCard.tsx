import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionCardProps = {
  title: string;
  count: number;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  tone?: "amber" | "red" | "teal" | "neutral" | "gold";
};

const toneStyles = {
  amber: "border-amber-200/80 bg-amber-50/60 hover:border-amber-300/80",
  red: "border-red-200/80 bg-red-50/50 hover:border-red-300/80",
  teal: "border-teal/20 bg-teal/5 hover:border-teal/35",
  gold: "border-gold/25 bg-[#faf6ef] hover:border-gold/40",
  neutral: "border-border bg-white hover:border-gold/25",
};

const iconTone = {
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  teal: "bg-teal/15 text-teal",
  gold: "bg-gold/15 text-gold-dark",
  neutral: "bg-sand text-charcoal/70",
};

export function AdminActionCard({
  title,
  count,
  description,
  href,
  cta,
  icon: Icon,
  tone = "neutral",
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col rounded-2xl border p-5 shadow-soft transition-all hover:shadow-card",
        toneStyles[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconTone[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-display text-3xl font-bold tabular-nums text-charcoal">{count}</span>
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-charcoal">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold group-hover:gap-2 transition-all">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
