"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MidoraIcon } from "@/components/brand/MidoraIcon";

export const MIDORA_MARK_SRC = "/brand/midora-mark.png";

type Props = {
  className?: string;
  showWordmark?: boolean;
  /** Premium header lockup vs compact usage in footer/dashboard. */
  variant?: "header" | "default";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  href?: string | null;
  suffix?: React.ReactNode;
  /** White icon + wordmark for transparent hero / dark bars. */
  onDark?: boolean;
};

const defaultSizeConfig = {
  sm: {
    gap: "gap-2.5",
    icon: "h-[30px] w-auto",
    word: "text-[20px]",
  },
  md: {
    gap: "gap-3",
    icon: "h-[34px] w-auto",
    word: "text-[24px]",
  },
  lg: {
    gap: "gap-3",
    icon: "h-[38px] w-auto",
    word: "text-[28px]",
  },
  xl: {
    gap: "gap-3.5",
    icon: "h-[46px] w-auto",
    word: "text-[34px]",
  },
  "2xl": {
    gap: "gap-4",
    icon: "h-[56px] w-auto sm:h-[62px]",
    word: "text-[40px] sm:text-[44px]",
  },
} as const;

export function MidoraLogo({
  className,
  showWordmark = true,
  variant = "default",
  size = "md",
  href = "/",
  suffix,
  onDark = false,
}: Props) {
  const t = useTranslations("Brand");
  const isHeader = variant === "header";
  const dim = defaultSizeConfig[size];

  const lockupClass = cn(
    "midora-brand-link inline-flex flex-row flex-nowrap items-center whitespace-nowrap",
    isHeader ? "midora-brand-lockup--header" : dim.gap,
    onDark && "midora-brand-link--on-dark",
    className
  );

  const inner = (
    <>
      <MidoraIcon
        tone={onDark ? "white" : "brand"}
        className={isHeader ? undefined : dim.icon}
      />
      {showWordmark && (
        <span
          className={cn(
            isHeader ? "midora-brand-wordmark--header" : "midora-brand-wordmark",
            !isHeader && dim.word
          )}
        >
          Midora
        </span>
      )}
      {suffix ? (
        <span className={cn(isHeader ? "midora-brand-wordmark--header" : "midora-brand-wordmark", !isHeader && dim.word)}>
          {suffix}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={lockupClass} aria-label={t("homeAria")}>
        {inner}
      </Link>
    );
  }

  return <div className={lockupClass}>{inner}</div>;
}
