"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bug } from "lucide-react";
import { BugReportModal } from "@/components/feedback/BugReportButton";

export function BugReportMenuItem({ onOpen }: { onOpen?: () => void }) {
  const t = useTranslations("Feedback");
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setShowModal(true);
          onOpen?.();
        }}
        className="flex w-full items-center gap-3 text-sm text-charcoal/80 hover:text-gold-dark"
      >
        <Bug className="h-4 w-4 text-gold" />
        {t("reportIssue")}
      </button>
      <BugReportModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
