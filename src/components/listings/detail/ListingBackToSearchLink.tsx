"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getSearchReturnUrlWithFallback } from "@/lib/midora-search-state";

export function ListingBackToSearchLink() {
  const searchParams = useSearchParams();
  const href = getSearchReturnUrlWithFallback(searchParams);

  return (
    <Link
      href={href}
      className="mb-2 inline-flex min-h-7 items-center gap-1.5 text-sm text-muted hover:text-gold"
    >
      <ArrowLeft className="h-4 w-4" />
      Πίσω στην αναζήτηση
    </Link>
  );
}
