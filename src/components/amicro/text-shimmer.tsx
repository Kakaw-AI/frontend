"use client";

import { motion } from "framer-motion";

/** Text with a light sweep across it, for "working on it" states. */
export function TextShimmer({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <motion.span
      className={`inline-block bg-size-[200%_100%] bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-on-surface-variant) 0%, var(--color-on-surface-variant) 35%, var(--color-on-surface) 50%, var(--color-on-surface-variant) 65%, var(--color-on-surface-variant) 100%)",
      }}
      initial={{ backgroundPosition: "100% 0%" }}
      animate={{ backgroundPosition: "-100% 0%" }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  );
}
