import type { ReactNode } from "react";

// A 375×812 iPhone-style screen, scaled to fit the editor column. The screen scrolls on its
// own, so the profile's sticky bar behaves as it will on a real phone.
const SCALE = 0.8;

export function PhonePreview({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mx-auto" style={{ width: (375 + 24) * SCALE, height: (812 + 24) * SCALE }}>
      <div
        role="region"
        aria-label={label}
        className="relative origin-top-left rounded-[3.25rem] border-[12px] border-zinc-900 bg-zinc-900 shadow-2xl ring-1 ring-white/15"
        style={{ width: 375 + 24, height: 812 + 24, transform: `scale(${SCALE})` }}
      >
        {/* Dynamic Island */}
        <div
          aria-hidden
          className="absolute top-2 left-1/2 z-40 h-7 w-28 -translate-x-1/2 rounded-full bg-black"
        />
        <div
          data-scroll-root
          className="h-full w-full [scrollbar-width:none] overflow-x-hidden overflow-y-auto rounded-[2.5rem] bg-[#eef0f4]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
