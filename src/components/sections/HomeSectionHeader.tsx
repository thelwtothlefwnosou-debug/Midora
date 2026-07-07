import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
  centered?: boolean;
};

export function HomeSectionHeader({
  title,
  subtitle,
  className,
  action,
  centered = false,
}: Props) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10",
        centered && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        <h2 className="font-display text-[1.625rem] font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-[2rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted/90 sm:mt-3">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function HomeIconBadge({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-sand/80 to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
        className
      )}
    >
      <Icon className="h-[18px] w-[18px] text-gold" strokeWidth={1.75} aria-hidden />
    </span>
  );
}
