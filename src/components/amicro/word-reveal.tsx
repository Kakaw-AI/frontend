"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

interface WordRevealProps {
  text: string;
  duration?: number;
  staggerDelay?: number;
  className?: string;
}

export function WordReveal({
  text,
  duration = 0.5,
  staggerDelay = 0.04,
  className = "",
}: WordRevealProps) {
  const words = text.split(/\s+/);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration,
        ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
      },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={`inline-flex flex-wrap gap-x-[0.25em] ${className}`}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, index) => (
        <motion.span
          aria-hidden
          key={index}
          variants={wordVariants}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
