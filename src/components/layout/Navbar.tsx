"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Home, Heart, Plus, Inbox, MessageSquare, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SiteHeaderActions } from "@/components/layout/SiteHeaderActions";
import { MidoraLogo } from "@/components/brand/MidoraLogo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";

const links = [
  { label: "Ακίνητα", href: "/listings" },
  { label: "Πώς λειτουργεί", href: "/how-it-works" },
  { label: "Για ιδιοκτήτες", href: "/owners" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  const navLinkClass = (href: string) =>
    cn(
      "site-header-nav-link",
      pathname === href || pathname.startsWith(`${href}/`) ? "text-charcoal" : undefined
    );

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-[100] transition-all duration-300",
        scrolled
          ? "border-b border-border bg-white/95 shadow-soft backdrop-blur-xl"
          : "bg-white/80 backdrop-blur-md"
      )}
    >
      <nav className="site-header-bar relative">
        <div className="site-header-brand">
          <MidoraLogo href="/" variant="header" />
        </div>

        <div className="site-header-nav">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={navLinkClass(link.href)}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/dashboard/favorites"
              className={navLinkClass("/dashboard/favorites")}
              aria-current={pathname === "/dashboard/favorites" ? "page" : undefined}
            >
              Αγαπημένα
            </Link>
          )}
        </div>

        <div className="site-header-actions">
          <SiteHeaderActions user={user} variant="default" />
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-charcoal md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Μενού"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-white md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
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
                Αγαπημένα
              </Link>
            )}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
              <Button href={OWNER_LISTING_NEW_PATH} size="md" variant="dark">
                <Plus className="h-4 w-4" />
                Ανέβασε αγγελία
              </Button>
              {user ? (
                <>
                  <Button href="/dashboard" size="md" variant="outline">
                    <LayoutDashboard className="h-4 w-4" />
                    Επισκόπηση
                  </Button>
                  <Button href="/dashboard/listings" variant="outline" size="md">
                    <Home className="h-4 w-4" />
                    Οι αγγελίες μου
                  </Button>
                  <Button href="/dashboard/requests" variant="outline" size="md">
                    <Inbox className="h-4 w-4" />
                    Ενδιαφέροντα
                  </Button>
                  <Button href="/dashboard/messages" variant="outline" size="md">
                    <MessageSquare className="h-4 w-4" />
                    Μηνύματα
                  </Button>
                  <Button href="/dashboard/favorites" variant="outline" size="md">
                    <Heart className="h-4 w-4" />
                    Αγαπημένα
                  </Button>
                  <Button href="/dashboard/settings" variant="outline" size="md">
                    <Settings className="h-4 w-4" />
                    Ρυθμίσεις
                  </Button>
                  <form action={signOut}>
                    <Button type="submit" variant="outline" size="md" className="w-full">
                      Αποσύνδεση
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button href="/login" variant="outline" size="md">
                    Σύνδεση
                  </Button>
                  <Button href="/login?mode=register" variant="dark" size="md">
                    Εγγραφή
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
