import type { CSSProperties } from "react";

// Decorative animated background (slow-drifting colour blobs). Pure CSS, see globals.css.
// Override --aurora-1/2/3 through `style` to tint it, e.g. with a profile's accent.
export function Aurora({ style }: { style?: CSSProperties }) {
  return (
    <div aria-hidden className="aurora" style={style}>
      <span />
      <span />
      <span />
    </div>
  );
}
