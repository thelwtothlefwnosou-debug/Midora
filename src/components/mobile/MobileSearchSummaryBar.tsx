"use client";

import { Search } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  onOpen: () => void;
};

/** Compact search summary for listings — phone only (parent gates visibility). */
export function MobileSearchSummaryBar({ title, subtitle, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="midora-msearch-summary"
      aria-label={title}
    >
      <span className="midora-msearch-summary__icon-wrap" aria-hidden>
        <Search className="midora-msearch-summary__icon" strokeWidth={2} />
      </span>
      <span className="midora-msearch-summary__copy">
        <span className="midora-msearch-summary__title">{title}</span>
        {subtitle ? (
          <span className="midora-msearch-summary__subtitle">{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}
