"use client";

import { BugReportButton } from "@/components/feedback/BugReportButton";

export function FooterBugReport() {
  return (
    <BugReportButton className="text-sm text-muted transition-colors hover:text-gold-dark">
      Αναφορά προβλήματος
    </BugReportButton>
  );
}
