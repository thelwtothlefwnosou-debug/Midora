"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SavedSearch } from "@/lib/types";
import { deleteSavedSearch, updateSavedSearch } from "@/lib/actions";
import { savedSearchToUrl } from "@/lib/saved-searches";

export function SavedSearchRow({ search }: { search: SavedSearch }) {
  const t = useTranslations("Owner.savedSearchRow");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(search.name);
  const [emailAlerts, setEmailAlerts] = useState(search.email_alerts !== false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(t("confirmDelete", { name: search.name }))) return;
    startTransition(async () => {
      await deleteSavedSearch(search.id);
    });
  }

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", search.id);
      fd.set("name", name.trim());
      await updateSavedSearch(fd);
      setEditing(false);
    });
  }

  function toggleEmailAlerts() {
    const next = !emailAlerts;
    setEmailAlerts(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", search.id);
      fd.set("email_alerts", next ? "true" : "false");
      const result = await updateSavedSearch(fd);
      if (result?.error) setEmailAlerts(!next);
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-sand/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {editing ? (
          <form onSubmit={handleSaveName} className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-sand/50 px-3 py-2 text-charcoal outline-none focus:border-gold/50"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-white"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(search.name);
                setEditing(false);
              }}
              className="text-xs text-muted hover:text-charcoal"
            >
              {t("cancel")}
            </button>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-charcoal">{search.name}</p>
              {emailAlerts && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                  <Bell className="h-3 w-3" />
                  {t("emailAlertsBadge")}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-muted">
              {savedSearchToUrl(search.filters).replace("/listings?", "") || t("noFilters")}
            </p>
          </>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleEmailAlerts}
            disabled={pending}
            title={emailAlerts ? t("disableEmail") : t("enableEmail")}
            className="rounded-lg border border-border p-2 text-muted hover:text-gold"
          >
            {emailAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          <Link
            href={savedSearchToUrl(search.filters)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-charcoal/70 hover:border-gold/30 hover:text-gold"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("search")}
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-border p-2 text-muted hover:text-gold"
            aria-label={t("edit")}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg border border-border p-2 text-muted hover:text-red-400"
            aria-label={t("delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}
