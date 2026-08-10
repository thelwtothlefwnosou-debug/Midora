"use client";

import { Search } from "lucide-react";

type Props = {
  onOpen: () => void;
};

/** Collapsed premium search entry — phone only (parent gates visibility). */
export function MobileSearchCollapsedBar({ onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="midora-msearch-collapsed"
      aria-label="Ξεκινήστε την αναζήτησή σας"
    >
      <Search className="midora-msearch-collapsed__icon" strokeWidth={2} aria-hidden />
      <span className="midora-msearch-collapsed__text">Ξεκινήστε την αναζήτησή σας</span>
    </button>
  );
}
