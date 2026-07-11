"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  OWNER_LISTINGS_LIST_PATH,
  shouldForceOwnerListingsListNav,
} from "@/lib/owner-listings-nav";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href?: string;
};

export function OwnerListingsNavLink({ href = OWNER_LISTINGS_LIST_PATH, onClick, ...props }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const routerReady = useRef(false);

  useEffect(() => {
    routerReady.current = true;
  }, []);

  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (!shouldForceOwnerListingsListNav(pathname)) return;

        e.preventDefault();
        if (!routerReady.current) {
          window.location.assign(OWNER_LISTINGS_LIST_PATH);
          return;
        }
        startTransition(() => {
          router.push(OWNER_LISTINGS_LIST_PATH);
        });
      }}
    />
  );
}
