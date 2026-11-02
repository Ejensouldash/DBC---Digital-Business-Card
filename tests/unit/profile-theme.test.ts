import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, parseTheme, profileThemeSchema, THEME_ACCENTS } from "@/lib/profile-theme";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

describe("parseTheme", () => {
  it("falls back to the default for empty or invalid stored values", () => {
    expect(parseTheme({})).toEqual(DEFAULT_THEME);
    expect(parseTheme(null)).toEqual(DEFAULT_THEME);
    expect(parseTheme("blue")).toEqual(DEFAULT_THEME);
  });

  it("keeps valid fields and replaces invalid ones individually", () => {
    expect(parseTheme({ accent: "teal", layout: "nope" })).toEqual({
      accent: "teal",
      layout: "cover",
    });
    expect(parseTheme({ accent: "#ff00ff", layout: "compact" })).toEqual({
      accent: "neutral",
      layout: "compact",
    });
  });
});

describe("profileThemeSchema", () => {
  it("rejects colours outside the curated list", () => {
    expect(profileThemeSchema.safeParse({ accent: "#ff00ff", layout: "cover" }).success).toBe(
      false,
    );
  });
});

describe("THEME_ACCENTS", () => {
  it.each(Object.entries(THEME_ACCENTS))("%s is AA readable against white", (_, hex) => {
    const contrast = (1 + 0.05) / (luminance(hex) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
