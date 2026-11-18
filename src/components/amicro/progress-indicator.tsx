"use client";

import { motion, useScroll, useSpring } from "framer-motion";

interface ProgressIndicatorProps {
  className?: string;
  height?: number;
}

export function ProgressIndicator({
  className = "bg-primary",
  height = 3,
}: ProgressIndicatorProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, height }}
      className={`fixed inset-x-0 top-0 z-[9999] origin-left ${className}`}
    />
  );
}
