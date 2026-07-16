"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HelpAssistantContextValue = {
  open: boolean;
  seedQuestion: string | null;
  openHelp: (seedQuestion?: string) => void;
  closeHelp: () => void;
};

const HelpAssistantContext = createContext<HelpAssistantContextValue | null>(null);

export function HelpAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seedQuestion, setSeedQuestion] = useState<string | null>(null);

  const openHelp = useCallback((question?: string) => {
    setSeedQuestion(question?.trim() || null);
    setOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setOpen(false);
    setSeedQuestion(null);
  }, []);

  const value = useMemo(
    () => ({ open, seedQuestion, openHelp, closeHelp }),
    [open, seedQuestion, openHelp, closeHelp]
  );

  return (
    <HelpAssistantContext.Provider value={value}>{children}</HelpAssistantContext.Provider>
  );
}

export function useHelpAssistant() {
  const ctx = useContext(HelpAssistantContext);
  if (!ctx) {
    throw new Error("useHelpAssistant must be used within HelpAssistantProvider");
  }
  return ctx;
}

/** Inline trigger — opens the global help panel. */
export function HelpAssistantTrigger({
  label,
  className,
  seedQuestion,
}: {
  label: string;
  className?: string;
  seedQuestion?: string;
}) {
  const { openHelp } = useHelpAssistant();

  return (
    <button
      type="button"
      onClick={() => openHelp(seedQuestion)}
      className={className}
    >
      {label}
    </button>
  );
}
