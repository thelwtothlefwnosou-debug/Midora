"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  type?: "button" | "submit";
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  type = "button",
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 rounded-full overflow-hidden";

  const variants = {
    primary:
      "bg-gold text-white shadow-[0_4px_20px_-4px_rgba(193,154,107,0.5)] hover:bg-gold-dark hover:shadow-[0_8px_28px_-4px_rgba(193,154,107,0.55)]",
    dark: "bg-charcoal text-white hover:bg-charcoal/90 shadow-soft",
    ghost: "text-muted hover:text-charcoal hover:bg-sand/80",
    outline:
      "border border-border text-charcoal hover:border-gold/40 hover:bg-sand/50",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    const isInternal = href.startsWith("/") && !href.startsWith("//");
    if (isInternal) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
