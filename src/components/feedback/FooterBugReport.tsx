"use client";

import { useTranslations } from "next-intl";
import { BugReportButton } from "@/components/feedback/BugReportButton";
import { cn } from "@/lib/utils";

export function FooterBugReport({ className }: { className?: string }) {
  const t = useTranslations("Feedback");

  return (
    <BugReportButton
      className={cn(
        "site-footer-link cursor-pointer border-0 bg-transparent p-0 text-left",
        className
      )}
    >
      {t("reportIssue")}
    </BugReportButton>
  );
}
