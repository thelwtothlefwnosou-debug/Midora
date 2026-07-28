"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/lib/types";
import { profileCompletionItems, profileCompletionPercent } from "@/lib/owner-dashboard";

const PROFILE_COMPLETION_IDS = ["name", "phone", "avatar", "bio", "languages"] as const;
type ProfileCompletionId = (typeof PROFILE_COMPLETION_IDS)[number];

function isProfileCompletionId(id: string): id is ProfileCompletionId {
  return (PROFILE_COMPLETION_IDS as readonly string[]).includes(id);
}

type Props = {
  profile: Profile;
  email: string;
};

export function OwnerProfileCompletionCompact({ profile, email }: Props) {
  const t = useTranslations("Owner.home.profile");
  const tItems = useTranslations("Owner.profileCompletion");
  const percent = profileCompletionPercent(profile, email);
  const pending = profileCompletionItems(profile, email).filter((i) => !i.done).slice(0, 3);

  if (pending.length === 0) return null;

  const firstHref = pending[0]?.href ?? "/dashboard/settings/profile";

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-charcoal">
            {t("title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{t("percentDone", { percent })}</p>
        </div>
        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold-dark">
          {percent}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {pending.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="text-sm text-charcoal/80 hover:text-gold-dark">
              · {isProfileCompletionId(item.id) ? tItems(item.id) : item.id}
            </Link>
          </li>
        ))}
      </ul>

      <Button href={firstHref} size="sm" variant="outline" className="mt-4 w-full">
        {t("cta")}
      </Button>
    </section>
  );
}
