"use client";

import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { NfcIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PointerEvent } from "react";

const SPRING = { stiffness: 150, damping: 18 };
const RIPPLES = [0, 1, 2];

// Decorative: a glass business card that tilts towards the pointer, floats, and sends out
// NFC "tap" ripples. Hidden from screen readers; the hero text says the same thing.
export function NfcCardMockup() {
  const t = useTranslations("Landing");
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [14, -14]), SPRING);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-16, 16]), SPRING);
  const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-sm [perspective:1000px]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <m.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <m.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative aspect-[1.586] overflow-hidden rounded-3xl glass p-6"
        >
          {/* Holographic tint and a glare that follows the pointer. */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(0_168_182/0.15),transparent_45%,rgb(140_198_63/0.12))]" />
          <m.div
            className="absolute inset-y-0 w-1/2 bg-[linear-gradient(105deg,transparent,rgb(255_255_255/0.3),transparent)]"
            style={{ left: glareX, x: "-50%" }}
          />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold tracking-wide">{t("brand")}</span>
              <span className="relative flex size-10 items-center justify-center">
                {RIPPLES.map((i) => (
                  <m.span
                    key={i}
                    className="absolute inset-0 rounded-full border border-teal-400/50"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 2.4], opacity: [0.8, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      delay: i * 0.8,
                      ease: "easeOut",
                    }}
                  />
                ))}
                <NfcIcon className="relative size-6 text-teal-600" />
              </span>
            </div>
            <div>
              <p className="text-xl font-semibold">{t("cardName")}</p>
              <p className="text-sm text-muted-foreground">{t("cardRole")}</p>
            </div>
          </div>
        </m.div>
      </m.div>
      {/* Soft reflection under the card. */}
      <div className="mx-auto mt-6 h-6 w-2/3 rounded-full bg-teal-500/15 blur-2xl" />
    </div>
  );
}
