"use client";

import { m } from "motion/react";

// The headline arrives word by word. Screen readers get the plain sentence.
export function HeroHeadline({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <m.span
            key={`${word}-${i}`}
            className="inline-block bg-gradient-to-br from-slate-900 via-teal-900 to-teal-600 bg-clip-text pr-[0.25em] text-transparent"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {word}
          </m.span>
        ))}
      </span>
    </h1>
  );
}
