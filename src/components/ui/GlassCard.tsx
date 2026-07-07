"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = React.ComponentProps<typeof motion.div> & {
  glow?: boolean;
  overflowVisible?: boolean;
  hover?: boolean;
};

export function GlassCard({
  className,
  glow,
  overflowVisible,
  hover = true,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border border-border bg-white backdrop-blur-sm",
        overflowVisible ? "overflow-visible" : "overflow-hidden",
        glow && "shadow-card",
        !glow && "shadow-soft",
        hover && "card-3d",
        className
      )}
      whileHover={hover ? { y: -4 } : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
