"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@/lib/types";
import {
  profileCompletionItems,
  profileCompletionPercent,
  profileRequiredComplete,
} from "@/lib/owner-dashboard";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Check, Circle, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "midora-profile-onboarding-dismissed";

const PROFILE_COMPLETION_IDS = ["name", "phone", "avatar", "bio", "languages"] as const;
type ProfileCompletionId = (typeof PROFILE_COMPLETION_IDS)[number];

function isProfileCompletionId(id: string): id is ProfileCompletionId {
  return (PROFILE_COMPLETION_IDS as readonly string[]).includes(id);
}

export function DashboardProfileCard({
  profile,
  email,
  avatarUrl,
  collapsed = false,
  compact = false,
}: {
  profile: Profile;
  email: string;
  avatarUrl?: string | null;
  collapsed?: boolean;
  compact?: boolean;
}) {
  const tHeader = useTranslations("Owner.dashboardHeader");
  const tCard = useTranslations("Owner.profileCard");
  const tProfile = useTranslations("Owner.home.profile");
  const tItems = useTranslations("Owner.profileCompletion");
  const tPreview = useTranslations("Owner.profilePreview");
  const tShell = useTranslations("Dashboard.shell");
  const percent = profileCompletionPercent(profile, email);
  const items = profileCompletionItems(profile, email);
  const requiredPending = items.filter((item) => item.required && !item.done);
  const recommendedPending = items.filter((item) => !item.required && !item.done);
  const pendingItems = [...requiredPending, ...recommendedPending];
  const requiredDone = profileRequiredComplete(profile, email);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  function itemLabel(id: string): string {
    return isProfileCompletionId(id) ? tItems(id) : id;
  }

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (compact && requiredDone && !collapsed) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-white px-2.5 py-2 shadow-soft">
        <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-charcoal">
            {profile.full_name || tHeader("userFallback")}
          </p>
          {recommendedPending.length > 0 && (
            <Link href="/dashboard/profile" className="text-[10px] font-medium text-gold-dark hover:underline">
              {tProfile("title")} {percent}%
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (requiredDone && recommendedPending.length === 0) {
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
              {profile.full_name || tHeader("userFallback")}
            </p>
            <p className="mt-0.5 text-xs font-medium text-gold-dark">{tPreview("ownerRole")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (requiredDone && recommendedPending.length > 0 && (dismissed && !expanded)) {
    return (
      <div className="rounded-2xl border border-border bg-white p-3 shadow-soft">
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={{ ...profile, email }} imageUrl={avatarUrl} size="md" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-charcoal">
                {profile.full_name || tHeader("userFallback")}
              </p>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-0.5 flex items-center gap-1 text-xs font-medium text-gold-dark hover:underline"
              >
                {tCard("completePercent", { percent })}
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
                {profile.full_name || tHeader("userFallback")}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gold-dark">{tPreview("ownerRole")}</p>
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
              aria-label={tShell("close")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{tProfile("percentDone", { percent })}</p>
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
              {itemLabel(item.id)}
            </Link>
          </li>
        ))}
        {profileCompletionItems(profile, email)
          .filter((item) => item.done)
          .slice(0, 1)
          .map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-xs text-muted">
              <Check className="h-3.5 w-3.5 shrink-0 text-teal" />
              {itemLabel(item.id)}
            </li>
          ))}
      </ul>

      <Link
        href="/dashboard/profile"
        className={cn(
          "mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-xl",
          "bg-charcoal text-xs font-semibold text-white hover:bg-charcoal/90"
        )}
      >
        {requiredPending.length > 0 ? tCard("completeCta") : tCard("improveCta")}
      </Link>
    </div>
  );
}
