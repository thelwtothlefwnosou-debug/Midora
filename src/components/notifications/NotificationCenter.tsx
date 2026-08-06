"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, X } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import { formatNotificationRelativeTime } from "@/lib/notifications/format";
import { isSafeNotificationHref } from "@/lib/notifications/href";
import type { AppNotification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

type Props = {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
};

function badgeLabel(count: number): string {
  if (count > 99) return "99+";
  if (count > 9) return "9+";
  return String(count);
}

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const t = useTranslations("Notifications");
  const tItems = useTranslations("Notifications.items");
  const locale = useLocale();
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    function sync() {
      setIsMobile(mq.matches);
    }
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onDoc(e: MouseEvent) {
      if (!isMobile && rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);

    if (isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener("mousedown", onDoc);
        document.removeEventListener("keydown", onKey);
      };
    }

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  // Browser back closes mobile sheet
  useEffect(() => {
    if (!open || !isMobile) return;
    window.history.pushState({ midoraNotifications: true }, "");
    function onPop() {
      setOpen(false);
    }
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [open, isMobile]);

  function close() {
    if (open && isMobile && window.history.state?.midoraNotifications) {
      window.history.back();
    }
    setOpen(false);
  }

  function openPanel() {
    setError(null);
    setOpen((v) => !v);
  }

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
      // Navigate even if mark-read failed — keep the row (not deleted).
      close();
      router.push(result.href && isSafeNotificationHref(result.href) ? result.href : href);
      router.refresh();
    });
  }

  const panel = (
    <div
      id={panelId}
      role="dialog"
      aria-modal={isMobile || undefined}
      aria-label={t("title")}
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        isMobile
          ? "max-h-[min(85dvh,calc(100dvh-5.5rem-env(safe-area-inset-bottom,0px)))] w-full rounded-t-2xl border border-border shadow-float"
          : "absolute right-0 z-50 mt-2 w-[min(100vw-2rem,360px)] max-h-96 rounded-2xl border border-border shadow-float"
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-charcoal">{t("title")}</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAll}
              disabled={pending}
              className="mt-1 min-h-10 text-left text-xs font-medium text-gold hover:underline disabled:opacity-60 sm:min-h-0"
            >
              {t("markAllRead")}
            </button>
          ) : null}
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {error ? (
          <li className="px-4 py-8 text-center text-sm text-muted">{error}</li>
        ) : notifications.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">{t("empty")}</li>
        ) : (
          notifications.slice(0, 6).map((n) => {
            const unread = !n.readAt;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  disabled={pending}
                  className={cn(
                    "flex w-full min-h-14 flex-col gap-0.5 border-b border-border px-4 py-3 text-left hover:bg-sand/40 disabled:opacity-60",
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
                    {unread ? (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  {n.bodyKey ? (
                    <span className="line-clamp-2 text-xs text-muted">
                      {tItems(n.bodyKey, n.bodyParams)}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-muted/80">
                    {formatNotificationRelativeTime(n.createdAt, locale)}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <Link
          href="/dashboard/notifications"
          onClick={close}
          className="flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-charcoal hover:bg-sand"
        >
          {t("viewAll")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={openPanel}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-sand sm:h-9 sm:w-9"
        aria-label={t("title")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <Bell className="h-4 w-4 text-charcoal/70" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badgeLabel(unreadCount)}
          </span>
        ) : null}
      </button>

      {open && isMobile ? (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/40"
            aria-label={t("close")}
            onClick={close}
          />
          <div className="relative z-[81] px-0 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2">
            {panel}
          </div>
        </div>
      ) : null}

      {open && !isMobile ? panel : null}
    </div>
  );
}
