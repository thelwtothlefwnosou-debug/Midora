"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import { formatNotificationRelativeTime } from "@/lib/notifications/format";
import { isSafeNotificationHref } from "@/lib/notifications/href";
import type { AppNotification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

export function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
}) {
  const t = useTranslations("Notifications");
  const tItems = useTranslations("Notifications.items");
  const locale = useLocale();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function markAll() {
    setError(null);
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.error) {
        setError(t("error"));
        return;
      }
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      router.refresh();
    });
  }

  function openItem(n: AppNotification) {
    setError(null);
    const href = isSafeNotificationHref(n.href) ? n.href : "/dashboard";
    startTransition(async () => {
      const result = await markNotificationRead(n.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id
              ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
              : item
          )
        );
        setUnreadCount((c) => Math.max(0, c - (n.readAt ? 0 : 1)));
      }
      router.push(
        result.href && isSafeNotificationHref(result.href) ? result.href : href
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAll}
            disabled={pending}
            className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium text-charcoal hover:bg-sand disabled:opacity-60"
          >
            {t("markAllRead")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-border bg-sand/40 px-4 py-3 text-sm text-muted">
          {error}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white px-4 py-12 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-white">
          {notifications.map((n) => {
            const unread = !n.readAt;
            return (
              <li key={n.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  disabled={pending}
                  className={cn(
                    "flex w-full min-h-14 flex-col gap-0.5 px-4 py-3.5 text-left hover:bg-sand/40 disabled:opacity-60",
                    unread && "bg-gold/5"
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm text-charcoal",
                        unread ? "font-semibold" : "font-medium"
                      )}
                    >
                      {tItems(n.titleKey)}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {formatNotificationRelativeTime(n.createdAt, locale)}
                    </span>
                  </span>
                  {n.bodyKey ? (
                    <span className="line-clamp-2 text-xs text-muted">
                      {tItems(n.bodyKey, n.bodyParams)}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-muted">
        <Link href="/dashboard" className="font-medium text-charcoal hover:underline">
          {t("backToDashboard")}
        </Link>
      </p>
    </div>
  );
}
