"use client";

import { motion } from "framer-motion";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-md bg-surface-container ${className}`}
    >
      <motion.div
        initial={{ x: "-150%" }}
        animate={{ x: "150%" }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="absolute inset-0 h-full w-[80%] bg-linear-to-r from-transparent via-surface-container-high to-transparent"
      />
    </div>
  );
}
