"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Loads only the DOM animation features (use `m.*`, not `motion.*`, inside) and honours the
// phone's "reduce motion" setting. Not used on the public profile, which animates with CSS.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
