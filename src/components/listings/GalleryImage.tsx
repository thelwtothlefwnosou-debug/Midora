"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { LISTING_PLACEHOLDER_LABEL } from "@/lib/listing-media";
import { cn } from "@/lib/utils";

export function GalleryImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center bg-sand/80 text-muted",
        className
      )}
    >
      <ImageOff className="h-8 w-8 opacity-50" strokeWidth={1.5} aria-hidden />
      <span className="mt-2 px-3 text-center text-xs font-medium">
        {LISTING_PLACEHOLDER_LABEL}
      </span>
    </div>
  );
}

export function GalleryImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return <GalleryImagePlaceholder className={className} />;
  }

  return (
    <div className={cn("relative h-full w-full", !className?.includes("object") && className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
