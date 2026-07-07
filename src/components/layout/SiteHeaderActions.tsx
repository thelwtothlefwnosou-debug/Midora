"use client";

import { Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/layout/UserMenu";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { cn } from "@/lib/utils";

type Props = {
  user: User | null;
  variant?: "default" | "search" | "listings";
  className?: string;
};

/** Header actions — search pages show only profile / login (Airbnb-style). */
export function SiteHeaderActions({ user, variant = "default", className }: Props) {
  const isSearch = variant === "search";
  const isListings = variant === "listings";

  if (isSearch) {
    return (
      <div className={cn("flex shrink-0 items-center", className)}>
        {user ? (
          <UserMenu user={user} compact />
        ) : (
          <Button href="/login" variant="outline" size="sm" className="rounded-full px-3.5">
            Σύνδεση
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5 sm:gap-2", className)}>
      <Button
        href={OWNER_LISTING_NEW_PATH}
        variant="outline"
        size="sm"
        className={cn(
          isListings &&
            "border-charcoal/12 bg-white/80 px-3.5 py-1.5 text-[13px] font-normal text-charcoal/75 shadow-none hover:border-gold/30 hover:bg-sand/40 hover:text-charcoal"
        )}
      >
        <Plus className={cn("h-4 w-4", isListings && "text-charcoal/60")} />
        <span className={isListings ? "hidden lg:inline" : undefined}>Ανέβασε αγγελία</span>
        {isListings && <span className="lg:hidden">Ανέβασμα</span>}
      </Button>
      {user ? (
        <UserMenu user={user} compact={isListings} />
      ) : (
        <>
          <Button href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
            Σύνδεση
          </Button>
          <Button href="/login?mode=register" variant="dark" size="sm" className="hidden sm:inline-flex">
            Εγγραφή
          </Button>
        </>
      )}
    </div>
  );
}
