"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import {
  profileCompletionItems,
  profileCompletionPercent,
} from "@/lib/owner-dashboard";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Check, Circle, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "midora-profile-onboarding-dismissed";

export function DashboardProfileCard({
  profile,
  email,
  avatarUrl,
  collapsed = false,
}: {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  collapsed?: boolean;
}) {
  const percent = profileCompletionPercent(profile, email);
  const pendingItems = profileCompletionItems(profile, email).filter((item) => !item.done);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (percent >= 100 || pendingItems.length === 0) {
    if (collapsed) {
      return (
        <div className="flex justify-center rounded-2xl border border-border bg-white p-3 shadow-soft">
          <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="md" />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold text-charcoal">
              {profile.full_name || "Χρήστης"}
            </p>
            <p className="mt-0.5 text-xs font-medium text-gold-dark">Αγγελιοδότης</p>
          </div>
        </div>
      </div>
    );
  }

  if (dismissed && !expanded) {
    return (
      <div className="rounded-2xl border border-border bg-white p-3 shadow-soft">
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="md" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-charcoal">
                {profile.full_name || "Χρήστης"}
              </p>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-0.5 flex items-center gap-1 text-xs font-medium text-gold-dark hover:underline"
              >
                Ολοκλήρωσε το προφίλ ({percent}%)
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="flex justify-center rounded-2xl border border-border bg-white p-3 shadow-soft">
        <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="md" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="truncate font-display text-base font-semibold text-charcoal">
                {profile.full_name || "Χρήστης"}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gold-dark">Αγγελιοδότης</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setDismissed(true);
                try {
                  localStorage.setItem(DISMISS_KEY, "1");
                } catch {
                  /* ignore */
                }
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-charcoal/50 hover:bg-sand"
              aria-label="Απόκρυψη"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{percent}% ολοκληρωμένο</p>
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {pendingItems.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-2 text-xs text-charcoal/80 hover:text-gold"
            >
              <Circle className="h-3.5 w-3.5 shrink-0 text-muted/50" />
              {item.label}
            </Link>
          </li>
        ))}
        {profileCompletionItems(profile, email)
          .filter((item) => item.done)
          .slice(0, 1)
          .map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-xs text-muted">
              <Check className="h-3.5 w-3.5 shrink-0 text-teal" />
              {item.label}
            </li>
          ))}
      </ul>

      <Link
        href="/dashboard/verification"
        className={cn(
          "mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-xl",
          "bg-charcoal text-xs font-semibold text-white hover:bg-charcoal/90"
        )}
      >
        Ολοκλήρωσε το προφίλ
      </Link>
    </div>
  );
}
