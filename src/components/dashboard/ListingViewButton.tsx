"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "secondary" | "ghost";
};

export function ListingViewButton({
  listingId,
  className,
  size = "sm",
  variant = "secondary",
}: Props) {
  const href = `/dashboard/listings/${listingId}/view`;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium text-charcoal transition-colors",
        size === "sm" ? "min-h-9 rounded-xl px-4 text-sm" : "min-h-11 rounded-xl px-5 text-sm",
        variant === "secondary" &&
          "border border-border bg-white hover:border-gold/30",
        variant === "ghost" && "hover:bg-sand/60",
        className
      )}
    >
      <Eye className="h-3.5 w-3.5 text-muted" />
      Προβολή
    </Link>
  );
}
