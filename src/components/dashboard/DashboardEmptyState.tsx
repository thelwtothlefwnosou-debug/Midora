import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
  compact?: boolean;
  className?: string;
};

export function DashboardEmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  actionHref,
  compact = false,
  className,
}: Props) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-dashed border-border bg-sand/20 px-4 py-4",
          className
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-soft">
          <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-charcoal">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{text}</p>
          {actionLabel && actionHref && (
            <Button href={actionHref} size="sm" variant="outline" className="mt-3">
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <GlassCard className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand">
        <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold text-charcoal">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{text}</p>
      {actionLabel && actionHref && (
        <Button href={actionHref} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </GlassCard>
  );
}
