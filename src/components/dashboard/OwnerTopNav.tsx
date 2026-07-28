"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { OWNER_TOP_NAV, resolveOwnerTopNavId } from "@/lib/owner-top-nav";
import { cn } from "@/lib/utils";

export function OwnerTopNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = resolveOwnerTopNavId(pathname);
  const t = useTranslations("OwnerNav");

  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      aria-label={t("ariaMain")}
    >
      {OWNER_TOP_NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "relative shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-charcoal/5 text-charcoal after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-gold"
                : "text-charcoal/55 hover:bg-sand/60 hover:text-charcoal"
            )}
          >
            {t(item.id)}
          </Link>
        );
      })}
    </nav>
  );
}

