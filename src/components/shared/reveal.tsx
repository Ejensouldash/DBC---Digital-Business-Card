"use client";

import { m, type Variants } from "motion/react";
import type { ReactNode } from "react";

const VARIANTS: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  // Animate when scrolled into view instead of on mount.
  inView?: boolean;
};

// Fade-and-rise entrance. Needs a MotionProvider above it.
export function Reveal({ children, className, delay = 0, inView = false }: RevealProps) {
  const trigger = inView
    ? { whileInView: "show", viewport: { once: true, margin: "-60px" } }
    : { animate: "show" };
  return (
    <m.div
      className={className}
      variants={VARIANTS}
      initial="hidden"
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay }}
      {...trigger}
    >
      {children}
    </m.div>
  );
}
