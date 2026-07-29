"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, LayoutDashboard, Home, Heart, Plus, Inbox, MessageSquare, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SiteHeaderActions } from "@/components/layout/SiteHeaderActions";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";

type NavbarProps = {
  variant?: "default" | "home";
};

export function Navbar({ variant = "default" }: NavbarProps) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const isHome = variant === "home" || pathname === "/";
  const overHero = isHome && !scrolled && !open;

  const links = [
    { label: t("home"), href: "/" },
    { label: t("howItWorks"), href: isHome ? "#explore" : "/how-it-works" },
    { label: t("forOwners"), href: isHome ? "#owners" : "/owners" },
    { label: t("listings"), href: "/listings?rentalType=short_term" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!isSupabaseConfigured()) {
      return () => window.removeEventListener("scroll", onScroll);
    }

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

  const navPath = (href: string) => href.split("?")[0] || href;

  const isNavActive = (href: string) => {
    if (href.startsWith("#")) return false;
    if (href === "/") return pathname === "/";
    const path = navPath(href);
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navLinkClass = (href: string) => {
    const active = isNavActive(href);
    return cn(
      "site-header-nav-link",
      overHero && "site-header-nav-link--on-hero",
      active ? (overHero ? "text-white" : "text-charcoal") : undefined
    );
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-[100] transition-all duration-300",
        overHero
          ? "border-b border-transparent bg-transparent"
          : scrolled || open
            ? "border-b border-border bg-white/95 shadow-soft backdrop-blur-xl"
            : "border-b border-transparent bg-white/80 backdrop-blur-md"
      )}
      data-over-hero={overHero ? "true" : undefined}
    >
      <nav className="site-header-bar">
        <div className="site-header-brand">
          <MidoraLogo
            href="/"
            variant="header"
            onDark={false}
            className={cn(overHero && "site-header-logo--on-hero")}
          />
        </div>

        <div className="site-header-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              scroll
              className={navLinkClass(link.href)}
              aria-current={isNavActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="site-header-right">
          <div className="site-header-actions">
            <LanguageSwitcher
              className={cn("site-header-lang", overHero && "site-header-lang--on-hero")}
            />
            <SiteHeaderActions user={user} variant="default" overHero={overHero} />
          </div>

          <button
            type="button"
            className={cn(
              "site-header-menu-btn rounded-lg p-2",
              overHero ? "text-white" : "text-charcoal"
            )}
            onClick={() => setOpen(!open)}
            aria-label={t("menu")}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            <div className="mb-2 px-4">
              <LanguageSwitcher />
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                scroll
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-charcoal/80 hover:bg-charcoal/5"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard/favorites"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-charcoal/80 hover:bg-charcoal/5"
              >
                {t("favorites")}
              </Link>
            )}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
              <Button href={OWNER_LISTING_NEW_PATH} size="md" variant="dark">
                <Plus className="h-4 w-4" />
                {t("listProperty")}
              </Button>
              {user ? (
                <>
                  <Button href="/dashboard" size="md" variant="outline">
                    <LayoutDashboard className="h-4 w-4" />
                    {t("overview")}
                  </Button>
                  <Button href="/dashboard/listings" variant="outline" size="md">
                    <Home className="h-4 w-4" />
                    {t("myListings")}
                  </Button>
                  <Button href="/dashboard/requests" variant="outline" size="md">
                    <Inbox className="h-4 w-4" />
                    {t("interests")}
                  </Button>
                  <Button href="/dashboard/messages" variant="outline" size="md">
                    <MessageSquare className="h-4 w-4" />
                    {t("messages")}
                  </Button>
                  <Button href="/dashboard/favorites" variant="outline" size="md">
                    <Heart className="h-4 w-4" />
                    {t("favorites")}
                  </Button>
                  <Button href="/dashboard/settings" variant="outline" size="md">
                    <Settings className="h-4 w-4" />
                    {t("settings")}
                  </Button>
                  <form action={signOut}>
                    <Button type="submit" variant="outline" size="md" className="w-full">
                      {t("signOut")}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button href="/login" variant="outline" size="md">
                    {t("signIn")}
                  </Button>
                  <Button href="/login?mode=register" variant="dark" size="md">
                    {t("signUp")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
