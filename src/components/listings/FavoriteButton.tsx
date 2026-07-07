"use client";

import { Heart } from "lucide-react";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initialFavorited?: boolean;
  className?: string;
  size?: "sm" | "md";
  variant?: "icon" | "label" | "underline" | "circle";
};

function FavoriteButtonInner({
  listingId,
  initialFavorited = false,
  className,
  size = "md",
  variant = "icon",
}: Props) {
  const { favorited, pending, toggle } = useFavoriteToggle(listingId, initialFavorited);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  const iconSize = size === "sm" ? "h-[18px] w-[18px]" : "h-[1.125rem] w-[1.125rem]";
  const iconBtnSize = size === "sm" ? "h-10 w-10" : "h-10 w-10";
  const iconClasses = cn(iconSize, favorited && "fill-charcoal text-charcoal");

  const circleClasses = cn(
    "inline-flex items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal transition-colors hover:border-charcoal/25 hover:bg-charcoal/[0.02]",
    iconBtnSize,
    pending && "opacity-60",
    className
  );

  const sharedClasses = cn(
    "inline-flex items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200",
    favorited
      ? "border-gold/35 bg-white/95 text-gold shadow-soft"
      : "border-white/70 bg-white/85 text-charcoal/65 shadow-soft hover:border-gold/30 hover:bg-white hover:text-gold",
    pending && "opacity-60",
    className
  );

  if (variant === "underline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={favorited ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-semibold text-charcoal underline decoration-charcoal underline-offset-[3px] transition-colors hover:text-charcoal/80",
          favorited && "decoration-charcoal/80",
          pending && "opacity-60",
          className
        )}
      >
        <Heart className={cn(iconSize, favorited && "fill-charcoal text-charcoal")} strokeWidth={1.75} />
        {favorited ? "Αποθηκευμένο" : "Αποθήκευση"}
      </button>
    );
  }

  if (variant === "circle") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={favorited ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
        title={favorited ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
        className={circleClasses}
      >
        <Heart className={cn(iconSize, favorited && "fill-charcoal text-charcoal")} strokeWidth={1.75} />
      </button>
    );
  }

  if (variant === "label") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={favorited ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
        className={cn(
          sharedClasses,
          "min-h-10 gap-2 px-4 py-2 text-sm font-medium",
          favorited && "text-gold"
        )}
      >
        <Heart className={iconClasses} />
        {favorited ? "Αποθηκευμένο" : "Αποθήκευση"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
      title={favorited ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
      className={cn(sharedClasses, iconBtnSize)}
    >
      <Heart className={iconClasses} />
    </button>
  );
}

export function FavoriteButton(props: Props) {
  return (
    <FavoriteButtonInner
      key={`${props.listingId}-${props.initialFavorited ? "1" : "0"}`}
      {...props}
    />
  );
}
