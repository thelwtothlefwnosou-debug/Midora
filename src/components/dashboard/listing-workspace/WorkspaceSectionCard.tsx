import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "emphasis" | "muted";
};

/** Consistent premium card shell for owner listing workspace sections. */
export function WorkspaceSectionCard({
  title,
  description,
  eyebrow,
  action,
  children,
  className,
  id,
  tone = "default",
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-soft sm:p-5",
        tone === "emphasis" && "border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-sand/30",
        tone === "muted" && "border-border/80 bg-sand/15",
        tone === "default" && "border-border",
        className
      )}
    >
      {(eyebrow || title || description || action) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h3
                className={cn(
                  "font-display text-sm font-semibold text-charcoal sm:text-[15px]",
                  eyebrow && "mt-1"
                )}
              >
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
