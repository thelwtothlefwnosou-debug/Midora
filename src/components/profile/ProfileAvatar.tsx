"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { avatarInitials, type ProfileAvatarFields } from "@/lib/profile-avatar";

type Props = {
  profile?: ProfileAvatarFields | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function ProfileAvatar({ profile, imageUrl, size = "md", className }: Props) {
  const initials = avatarInitials(profile ?? {});
  const src = imageUrl ?? null;

  if (src) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full bg-sand ring-1 ring-border",
          sizes[size],
          className
        )}
      >
        <Image src={src} alt="" fill className="object-cover" sizes="56px" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-charcoal font-semibold text-white ring-1 ring-border",
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
