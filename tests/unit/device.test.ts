import { describe, expect, it } from "vitest";

import { detectDeviceType, isBot } from "@/features/analytics/lib/device";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("detectDeviceType", () => {
  it.each([
    [IPHONE, "mobile"],
    [ANDROID_PHONE, "mobile"],
    [ANDROID_TABLET, "tablet"],
    [DESKTOP, "desktop"],
    ["", "unknown"],
  ])("classifies %s", (ua, expected) => {
    expect(detectDeviceType(ua)).toBe(expected);
  });
});

describe("isBot", () => {
  it("flags crawlers and link previews", () => {
    expect(isBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot(null)).toBe(true);
  });

  it("lets real browsers through", () => {
    expect(isBot(IPHONE)).toBe(false);
    expect(isBot(DESKTOP)).toBe(false);
  });
});
