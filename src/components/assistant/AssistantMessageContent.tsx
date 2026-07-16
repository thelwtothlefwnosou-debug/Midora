"use client";

import { cn } from "@/lib/utils";

/** Renders assistant text with readable paragraphs and numbered steps. */
export function AssistantMessageContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-2.5 text-[13px] leading-relaxed text-charcoal/92 sm:text-sm">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isNumberedList = lines.every(
          (line) => /^\d+[\.\)]\s/.test(line.trim()) || line.trim() === ""
        );

        if (isNumberedList && lines.filter((l) => l.trim()).length > 1) {
          return (
            <ol key={i} className="list-none space-y-1.5 pl-0">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => {
                  const match = line.trim().match(/^(\d+)[\.\)]\s*(.+)$/);
                  const text = match ? match[2] : line.trim();
                  const num = match ? match[1] : String(j + 1);
                  return (
                    <li key={j} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sand text-[11px] font-semibold text-charcoal/75">
                        {num}
                      </span>
                      <span className="min-w-0 pt-0.5">{text}</span>
                    </li>
                  );
                })}
            </ol>
          );
        }

        if (lines.length > 1) {
          return (
            <div key={i} className="space-y-1">
              {lines.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          );
        }

        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

export function AssistantTypingIndicator({
  label = "Το κοιτάζω",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mr-6 flex items-center gap-2.5 rounded-2xl border border-charcoal/8 bg-cream/50 px-3.5 py-2.5",
        className
      )}
      aria-live="polite"
    >
      <span className="flex gap-1" aria-hidden>
        <span className="assistant-typing-dot" />
        <span className="assistant-typing-dot animation-delay-150" />
        <span className="assistant-typing-dot animation-delay-300" />
      </span>
      <span className="text-xs text-muted sm:text-[13px]">{label}…</span>
    </div>
  );
}
