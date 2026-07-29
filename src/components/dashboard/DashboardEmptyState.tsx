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
  children?: React.ReactNode;
};

export function DashboardEmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  actionHref,
  compact = false,
  className,
  children,
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
          {children}
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
    <GlassCard
      hover={false}
      className={cn("flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-14", className)}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sand to-cream ring-1 ring-charcoal/6">
        <Icon className="h-7 w-7 text-gold-dark" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-charcoal">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{text}</p>
      {children}
      {actionLabel && actionHref ? (
        <Button href={actionHref} className="mt-6">
          {actionLabel}
        </Button>
      ) : null}
    </GlassCard>
  );
}
