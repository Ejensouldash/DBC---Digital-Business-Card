"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useClientOrigin(): string {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => "",
  );
}

export function useWebNfcSupport(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== "undefined" && "NDEFReader" in window,
    () => false,
  );
}

export function normalizeProfileUrl(url: string, clientOrigin: string): string {
  if (clientOrigin && !clientOrigin.includes("localhost") && url.includes("localhost")) {
    return url.replace(/^https?:\/\/localhost(:\d+)?/, clientOrigin);
  }
  return url;
}
