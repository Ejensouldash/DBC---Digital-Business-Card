import { z } from "zod";

// Curated accents rather than a free colour picker, so an owner can't pick something visitors
// can't read on the dark glass card. Each has:
//   solid: button background, with `on` as its text colour (at least 4.5:1, WCAG AA)
//   soft:  icons, glow and aurora tint on the dark surface (at least 4.5:1 against it)
export const THEME_ACCENTS = {
  neutral: { solid: "#e4e4e7", on: "#18181b", soft: "#e4e4e7" },
  blue: { solid: "#2563eb", on: "#ffffff", soft: "#93c5fd" },
  teal: { solid: "#0f766e", on: "#ffffff", soft: "#5eead4" },
  green: { solid: "#15803d", on: "#ffffff", soft: "#86efac" },
  orange: { solid: "#c2410c", on: "#ffffff", soft: "#fdba74" },
  red: { solid: "#dc2626", on: "#ffffff", soft: "#fca5a5" },
  pink: { solid: "#db2777", on: "#ffffff", soft: "#f9a8d4" },
  purple: { solid: "#7c3aed", on: "#ffffff", soft: "#c4b5fd" },
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
