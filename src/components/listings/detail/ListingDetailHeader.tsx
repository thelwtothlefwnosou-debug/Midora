"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { SiteHeaderActions } from "@/components/layout/SiteHeaderActions";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Compact Midora header for listing detail — logo and account actions only. */
export function ListingDetailHeader({ className }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);

    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-[100] border-b border-charcoal/8 bg-white/95 backdrop-blur-md transition-shadow",
        scrolled && "shadow-soft",
        className
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/listings"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-sm text-muted hover:text-gold lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Ακίνητα
        </Link>
        <MidoraLogo href="/" variant="header" className="shrink-0" />
        <SiteHeaderActions user={user} variant="listings" className="ml-auto shrink-0" />
      </div>
    </header>
  );
}
