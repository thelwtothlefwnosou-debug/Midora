import Link from "next/link";
import { OwnerListingsNavLink } from "@/components/dashboard/OwnerListingsNavLink";
import { OWNER_LISTINGS_LIST_PATH } from "@/lib/owner-listings-nav";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export function DashboardBreadcrumbTrail({ items, className }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 && <span className="text-muted/60">/</span>}
            {item.href && !isLast ? (
              item.href === OWNER_LISTINGS_LIST_PATH ? (
                <OwnerListingsNavLink
                  href={item.href}
                  className="text-muted transition-colors hover:text-charcoal"
                >
                  {item.label}
                </OwnerListingsNavLink>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted transition-colors hover:text-charcoal"
                >
                  {item.label}
                </Link>
              )
            ) : (
              <span className={isLast ? "font-medium text-charcoal" : "text-muted"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
