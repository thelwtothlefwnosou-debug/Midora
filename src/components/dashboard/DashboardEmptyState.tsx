import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
};

export function DashboardEmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  actionHref,
}: Props) {
  return (
    <GlassCard className="flex flex-col items-center px-6 py-14 text-center">
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
