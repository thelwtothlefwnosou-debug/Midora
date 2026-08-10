import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Decorative only — parent should provide aria when needed. */
  title?: string;
};

/**
 * Free Hosting visual signature — continuous-line hospitality heart
 * with inner open-hand / gesture flourish (locked mark from design review).
 * Feature sub-brand only. Does NOT replace the Midora logo.
 *
 * Stroke uses currentColor (Midora gold by default; white/cream on dark/gold CTAs).
 */
export function FreeHostingMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-gold", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* Outer heart */}
      <path
        d="M32 52
           C20.5 43.5 12.5 34.5 11.2 25.2
           C9.8 16.2 16.2 10.5 24.2 10.5
           C28.2 10.5 30.8 12.8 32 16
           C33.2 12.8 35.8 10.5 39.8 10.5
           C47.8 10.5 54.2 16.2 52.8 25.2
           C51.5 34.5 43.5 43.5 32 52 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner hospitality gesture / continuous flourish */}
      <path
        d="M22.5 28.5
           C24.8 24.2 28.2 22.2 31.8 23.4
           C35.6 24.6 37.2 28.4 35.8 32.2
           C34.6 35.2 31.8 37.4 28.6 38.6
           C32.4 37.8 36.4 38.6 39.6 41.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
