"use client";

import type { ReactNode } from "react";
import { CalendarClock, Flag, Info, KeyRound, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ListingRegistrySection } from "@/components/listings/short-term/ListingRegistrySection";
import { ListingReportButton } from "@/components/listings/ListingReportButton";
import {
  getHouseRulesItems,
  getPolicyLabel,
  resolvePetsPolicy,
  type HouseRuleItemKey,
} from "@/lib/house-rules";
import { formatAmaDisplay, listingRentalType } from "@/lib/rental-types";
import type { ListingPublicDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingPublicDetail;
  className?: string;
};

const STAY_RULE_KEYS = new Set<HouseRuleItemKey>([
  "checkIn",
  "checkOut",
  "maxGuests",
  "pets",
]);

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

function KnowCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-charcoal/8 bg-white text-charcoal">
          {icon}
        </span>
        <h3 className="text-[15px] font-semibold text-charcoal">{title}</h3>
      </div>
      <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-charcoal/75">{children}</div>
    </div>
  );
}

function stayRuleLines(
  listing: ListingPublicDetail,
  t: TranslateFn,
  tHouseRules: TranslateFn
): string[] {
  const lines: string[] = [];
  if (listing.check_in_from || listing.check_in_to) {
    const range = [listing.check_in_from, listing.check_in_to].filter(Boolean).join(" – ");
    lines.push(t("arrivalTimeLine", { range }));
  }
  if (listing.check_out_until) {
    lines.push(t("departureTimeLine", { value: listing.check_out_until }));
  }
  if (listing.max_guests != null) {
    lines.push(t("maxGuestsLine", { value: listing.max_guests }));
  }
  const pets = resolvePetsPolicy(listing);
  if (pets) {
    lines.push(t("petsLine", { value: getPolicyLabel(pets, tHouseRules) }));
  }
  return lines;
}

function policyLines(listing: ListingPublicDetail, t: TranslateFn): string[] {
  return getHouseRulesItems(listing, t)
    .filter((item) => !STAY_RULE_KEYS.has(item.key))
    .map((item) => `${item.label}: ${item.value}`);
}

export function ListingLegalSection({ listing, className }: Props) {
  const tShared = useTranslations("Legal.shared");
  const tDecl = useTranslations("Legal.declarations");
  const tLegalSection = useTranslations("Listing.legalSection");
  const tHouseRules = useTranslations("Listing.houseRules");
  const hasRegistry = Boolean(formatAmaDisplay(listing));
  const isMonthly = listingRentalType(listing) === "monthly";
  const stayLines = stayRuleLines(listing, tLegalSection, tHouseRules);
  const otherPolicyLines = policyLines(listing, tHouseRules);

  return (
    <section
      id="legal"
      className={cn(
        "listing-section scroll-mt-32 border-t border-charcoal/8 pt-10",
        className
      )}
    >
      <h2 className="listing-section-title">{tLegalSection("title")}</h2>

      <div className="mt-7 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        <KnowCard
          icon={<KeyRound className="h-4 w-4" aria-hidden />}
          title={tLegalSection("stayRulesTitle")}
        >
          {stayLines.length > 0 ? (
            stayLines.map((line) => <p key={line}>{line}</p>)
          ) : (
            <p className="text-muted">
              {isMonthly
                ? tLegalSection("stayRulesEmptyOwner")
                : tLegalSection("stayRulesEmptyHost")}
            </p>
          )}
        </KnowCard>

        <KnowCard
          icon={<CalendarClock className="h-4 w-4" aria-hidden />}
          title={tLegalSection("policyTitle")}
        >
          {otherPolicyLines.length > 0 ? (
            otherPolicyLines.map((line) => <p key={line}>{line}</p>)
          ) : (
            <p className="text-muted">
              {isMonthly
                ? tLegalSection("policyEmptyOwner")
                : tLegalSection("policyEmptyHost")}
            </p>
          )}
        </KnowCard>

        <KnowCard
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          title={tLegalSection("safetyTitle")}
        >
          <p>{tLegalSection("safetyCommLine")}</p>
          <p>{tLegalSection("safetyConfirmLine")}</p>
          <p className="text-charcoal/55">{tShared("safeCommMuted")}</p>
        </KnowCard>
      </div>

      {(hasRegistry || isMonthly) && (
        <div className="mt-8 rounded-xl border border-charcoal/8 bg-white/80 px-4 py-3.5 sm:px-5">
          <h3 className="text-sm font-semibold text-charcoal">{tLegalSection("registryTitle")}</h3>
          <div className="mt-2 text-sm leading-relaxed text-charcoal/75">
            {hasRegistry ? (
              <>
                <ListingRegistrySection listing={listing} embedded />
                <p className="mt-2 text-muted">{tLegalSection("registryOwnerNote")}</p>
              </>
            ) : (
              <p>{tDecl("monthlyHelper")}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-sand/25 px-4 py-3.5 sm:px-5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/45" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-charcoal">{tLegalSection("midoraRoleTitle")}</h3>
          <p className="text-sm leading-relaxed text-charcoal/75">
            {tLegalSection("midoraRoleBody")}
          </p>
          <p className="text-[13px] leading-relaxed text-charcoal/55">
            {tLegalSection("midoraRoleNote")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-charcoal/8 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <Flag className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/40" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-charcoal">{tLegalSection("reportTitle")}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              {tLegalSection("reportBody")}
            </p>
          </div>
        </div>
        <div className="shrink-0 sm:pl-4">
          <ListingReportButton listingId={listing.id} listingTitle={listing.title} />
        </div>
      </div>
    </section>
  );
}
