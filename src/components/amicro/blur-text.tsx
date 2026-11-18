"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

interface BlurTextProps {
  text: string;
  duration?: number;
  staggerDelay?: number;
  initialBlur?: string;
  className?: string;
}

export function BlurText({
  text,
  duration = 0.5,
  staggerDelay = 0.02,
  initialBlur = "8px",
  className = "",
}: BlurTextProps) {
  const words = text.split(" ");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const charVariants: Variants = {
    hidden: { opacity: 0, filter: `blur(${initialBlur})` },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={`inline-block ${className}`}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(word).map((char, c) => (
            <motion.span
              key={c}
              variants={charVariants}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </motion.span>
  );
}
