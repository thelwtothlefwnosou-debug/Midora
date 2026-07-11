"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ImageIcon, Plus } from "lucide-react";
import { DashboardListingStatusBadge } from "@/components/dashboard/DashboardListingStatusBadge";
import type { ListingSwitcherItem } from "@/lib/listing-workspace-types";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { rentalTypeBadgeLabel } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

type Props = {
  currentListingId: string;
  items: ListingSwitcherItem[];
  className?: string;
};

export function ListingWorkspaceSwitcher({ currentListingId, items, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const current = items.find((item) => item.id === currentListingId) ?? items[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function switchTo(listingId: string) {
    if (listingId === currentListingId) {
      setOpen(false);
      return;
    }
    const suffix = pathname.replace(`/dashboard/listings/${currentListingId}`, "");
    const nextPath = `/dashboard/listings/${listingId}${suffix || ""}`;
    setOpen(false);
    router.push(nextPath);
  }

  if (!current) return null;

  return (
    <div ref={ref} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 text-left shadow-soft transition-colors hover:border-gold/30"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ListingThumb coverUrl={current.coverUrl} title={current.title} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-charcoal">
            {current.title}
          </span>
          <span className="block truncate text-xs text-muted">{current.location}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 max-h-[min(420px,70vh)] overflow-y-auto rounded-2xl border border-border bg-white p-2 shadow-card">
          <ul role="listbox" className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === currentListingId}
                  onClick={() => switchTo(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-sand/60",
                    item.id === currentListingId && "bg-sand/50 ring-1 ring-gold/20"
                  )}
                >
                  <ListingThumb coverUrl={item.coverUrl} title={item.title} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-charcoal">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted">{item.location}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-charcoal/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                        {rentalTypeBadgeLabel(item.rentalType)}
                      </span>
                      <DashboardListingStatusBadge
                        statusKey={item.statusKey}
                        label={item.statusLabel}
                        className="!space-y-0"
                      />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-border pt-2">
            <Link
              href={OWNER_LISTING_NEW_PATH}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sand/60"
            >
              <Plus className="h-4 w-4 text-gold" />
              Νέα αγγελία
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingThumb({
  coverUrl,
  title,
  size = "md",
}: {
  coverUrl: string | null;
  title: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10" : "h-11 w-11";
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-lg bg-sand/40", dim)}>
      {coverUrl ? (
        <Image src={coverUrl} alt="" fill className="object-cover" sizes="44px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted">
          <ImageIcon className="h-4 w-4 opacity-50" />
        </div>
      )}
    </div>
  );
}
