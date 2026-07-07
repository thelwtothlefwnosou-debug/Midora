"use client";

import { useTransition } from "react";
import {
  adminDeleteUnavailablePeriod,
  adminUpdateBugReport,
  adminUpdateLeadStatus,
  adminUpdateListingReport,
} from "@/lib/admin/actions";

function ActionBtn({
  label,
  onClick,
  pending,
}: {
  label: string;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="text-xs text-gold hover:underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function AdminLeadActions({ leadId, status }: { leadId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const run = (next: string) =>
    startTransition(() => {
      void adminUpdateLeadStatus(leadId, next);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "new" && (
        <ActionBtn label="Ανάγνωση" onClick={() => run("read")} pending={pending} />
      )}
      {status !== "archived" && (
        <ActionBtn label="Αρχειοθέτηση" onClick={() => run("archived")} pending={pending} />
      )}
    </div>
  );
}

export function AdminListingReportActions({
  reportId,
  status,
}: {
  reportId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const run = (next: string) =>
    startTransition(() => {
      void adminUpdateListingReport(reportId, next);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "new" && (
        <ActionBtn label="Έλεγχος" onClick={() => run("reviewing")} pending={pending} />
      )}
      {status !== "resolved" && (
        <ActionBtn label="Επίλυση" onClick={() => run("resolved")} pending={pending} />
      )}
      {status !== "dismissed" && (
        <ActionBtn label="Απόρριψη" onClick={() => run("dismissed")} pending={pending} />
      )}
    </div>
  );
}

export function AdminBugReportActions({
  reportId,
  status,
}: {
  reportId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const run = (next: string) =>
    startTransition(() => {
      void adminUpdateBugReport(reportId, next);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "new" && (
        <ActionBtn label="Έλεγχος" onClick={() => run("reviewing")} pending={pending} />
      )}
      {status !== "fixed" && (
        <ActionBtn label="Διορθώθηκε" onClick={() => run("fixed")} pending={pending} />
      )}
      {status !== "rejected" && (
        <ActionBtn label="Απόρριψη" onClick={() => run("rejected")} pending={pending} />
      )}
    </div>
  );
}

export function AdminUnavailableDelete({ periodId }: { periodId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ActionBtn
      label="Διαγραφή"
      pending={pending}
      onClick={() => {
        if (!confirm("Διαγραφή μη διαθέσιμης περιόδου;")) return;
        startTransition(() => {
          void adminDeleteUnavailablePeriod(periodId);
        });
      }}
    />
  );
}
