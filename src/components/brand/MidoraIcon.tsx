import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Official Midora monogram mark. */
export const MIDORA_MARK_SRC = "/brand/midora-mark.png";

/** Official Midora monogram — brand mark asset. */
export function MidoraIcon({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MIDORA_MARK_SRC}
      alt=""
      width={56}
      height={56}
      className={cn("midora-brand-icon block shrink-0", className)}
      aria-hidden="true"
      decoding="async"
    />
  );
}
