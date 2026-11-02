import { z } from "zod";

// Curated accents rather than a free colour picker: each has at least 4.5:1 contrast with white
// (WCAG AA), so it works both as a button with white text and as icon/text colour on the
// public profile's white cards.
export const THEME_ACCENTS = {
  neutral: "#18181b",
  blue: "#1d4ed8",
  teal: "#0f766e",
  green: "#15803d",
  orange: "#c2410c",
  red: "#b91c1c",
  pink: "#be185d",
  purple: "#6d28d9",
} as const;

export type ThemeAccent = keyof typeof THEME_ACCENTS;
const ACCENT_NAMES = Object.keys(THEME_ACCENTS) as [ThemeAccent, ...ThemeAccent[]];

// cover: banner image with the avatar overlapping it. compact: no banner, smaller header.
export const THEME_LAYOUTS = ["cover", "compact"] as const;
export type ThemeLayout = (typeof THEME_LAYOUTS)[number];

export const profileThemeSchema = z.object({
  accent: z.enum(ACCENT_NAMES),
  layout: z.enum(THEME_LAYOUTS),
});

export type ProfileTheme = z.output<typeof profileThemeSchema>;

export const DEFAULT_THEME: ProfileTheme = { accent: "neutral", layout: "cover" };

// Stored themes are jsonb; anything unknown or missing falls back field by field.
export function parseTheme(value: unknown): ProfileTheme {
  const stored = z.record(z.string(), z.unknown()).catch({}).parse(value);
  return {
    accent: profileThemeSchema.shape.accent.catch(DEFAULT_THEME.accent).parse(stored.accent),
    layout: profileThemeSchema.shape.layout.catch(DEFAULT_THEME.layout).parse(stored.layout),
  };
}
