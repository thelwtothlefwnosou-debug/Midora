"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  getSearchReturnUrl,
  getSearchReturnUrlWithFallback,
} from "@/lib/midora-search-state";

const DEFAULT_HREF = "/listings?rentalType=short_term";

export function ListingBackToSearchLink() {
  const t = useTranslations("Listing");
  const searchParams = useSearchParams();
  // URL-only on first paint so SSR and hydration match; sessionStorage after mount.
  const [href, setHref] = useState(() =>
    searchParams.toString() ? getSearchReturnUrl(searchParams) : DEFAULT_HREF
  );

  useEffect(() => {
    setHref(getSearchReturnUrlWithFallback(searchParams));
  }, [searchParams]);

  return (
    <Link
      href={href}
      className="mb-2 inline-flex min-h-7 items-center gap-1.5 text-sm text-muted hover:text-gold"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("backToSearch")}
    </Link>
  );
}
