"use client";

import { useEffect } from "react";

import type { TapBeacon as TapBeaconPayload } from "../schemas";

// Logs one visit per page view from a real browser. Server-side logging during render is
// unreliable here: a partially prerendered page can render more than once per request.
// sessionStorage dedupes reloads and language switches within the same visit.
export function TapBeacon({ slug, source }: TapBeaconPayload) {
  useEffect(() => {
    const key = `tap:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode): still log, just without dedupe.
    }
    const body = JSON.stringify({ slug, source });
    const sent = navigator.sendBeacon?.(
      "/api/taps",
      new Blob([body], { type: "application/json" }),
    );
    if (!sent) {
      void fetch("/api/taps", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  }, [slug, source]);

  return null;
}
