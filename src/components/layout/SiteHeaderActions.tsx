"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { cn } from "@/lib/utils";

type Props = {
  user: User | null;
  variant?: "default" | "search" | "listings";
  className?: string;
  overHero?: boolean;
};

/** Header actions — search pages show only profile / login (Airbnb-style). */
export function SiteHeaderActions({
  user,
  variant = "default",
  className,
  overHero = false,
}: Props) {
  const t = useTranslations("Nav");
  const isSearch = variant === "search";
  const isListings = variant === "listings";
  const isDefault = variant === "default";

  if (isSearch) {
    return (
      <div className={cn("flex shrink-0 items-center gap-2", className)}>
        <LanguageSwitcher />
        {user ? (
          <UserMenu user={user} compact />
        ) : (
          <Button href="/login" variant="outline" size="sm" className="rounded-full px-3.5">
            {t("signIn")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-3 sm:gap-3.5 lg:gap-4", className)}>
      {isListings && <LanguageSwitcher className={cn(overHero && "site-header-lang--on-hero")} />}
      <Button
        href={OWNER_LISTING_NEW_PATH}
        variant="outline"
        size="sm"
        className={cn(
          "shrink-0",
          isListings &&
            "border-charcoal/12 bg-white/80 px-3.5 py-1.5 text-[13px] font-normal text-charcoal/75 shadow-none hover:border-gold/30 hover:bg-sand/40 hover:text-charcoal",
          overHero &&
            "border-white/35 bg-white/10 text-white shadow-none hover:border-white/55 hover:bg-white/18 hover:text-white"
        )}
      >
        <Plus className={cn("h-4 w-4", isListings && "text-charcoal/60", overHero && "text-white")} />
        <span className={cn(isDefault && "hidden xl:inline", isListings && "hidden lg:inline")}>
          {t("listProperty")}
        </span>
        {isListings && <span className="lg:hidden">{t("listPropertyShort")}</span>}
        {isDefault && <span className="xl:hidden">{t("listPropertyShort")}</span>}
      </Button>
      {user ? (
        <UserMenu user={user} compact={isListings || isDefault} />
      ) : (
        <>
          <Button
            href="/login"
            variant="outline"
            size="sm"
            className={cn(
              "hidden shrink-0 lg:inline-flex",
              overHero &&
                "border-white/35 bg-transparent text-white hover:border-white/55 hover:bg-white/12 hover:text-white"
            )}
          >
            {t("signIn")}
          </Button>
          <Button
            href="/login?mode=register"
            variant="dark"
            size="sm"
            className={cn(
              "hidden shrink-0 xl:inline-flex",
              overHero && "bg-white text-charcoal hover:bg-white/90"
            )}
          >
            {t("signUp")}
          </Button>
        </>
      )}
    </div>
  );
}
