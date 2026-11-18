"use client";

import React, { useRef } from "react";
import { motion, useSpring } from "framer-motion";

interface MagneticProps {
  children: React.ReactNode;
  range?: number;
  strength?: number;
  className?: string;
}

/**
 * Pulls its child (a link or a button) toward the cursor. Wraps the child
 * instead of rendering its own button, so links keep their semantics.
 */
export function Magnetic({
  children,
  range = 80,
  strength = 0.25,
  className = "",
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const springConfig = { stiffness: 150, damping: 15, mass: 0.6 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = e.clientX - (left + width / 2);
    const dy = e.clientY - (top + height / 2);
    const inRange = Math.hypot(dx, dy) < range;
    x.set(inRange ? dx * strength : 0);
    y.set(inRange ? dy * strength : 0);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={`inline-flex ${className}`}
    >
      {children}
    </motion.span>
  );
}
