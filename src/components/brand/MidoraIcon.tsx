import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Brand gold mark (default) or pure white mark for dark/hero backgrounds. */
  tone?: "brand" | "white";
};

/** Official Midora monogram mark. */
export const MIDORA_MARK_SRC = "/brand/midora-mark-transparent.png";
export const MIDORA_MARK_WHITE_SRC = "/brand/midora-mark-white.png";
/** Original packaged asset (opaque cream background) — keep for reference/OG if needed. */
export const MIDORA_MARK_ORIGINAL_SRC = "/brand/midora-mark.png";

/** Official Midora monogram — real brand mark asset. */
export function MidoraIcon({ className, tone = "brand" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "white" ? MIDORA_MARK_WHITE_SRC : MIDORA_MARK_SRC}
      alt=""
      width={56}
      height={56}
      className={cn("midora-brand-icon block shrink-0", className)}
      aria-hidden="true"
      decoding="async"
    />
  );
}
