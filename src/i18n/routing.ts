import { defineRouting } from "next-intl/routing";

// BM is the default and has no URL prefix (/p/ali); English lives under /en.
export const routing = defineRouting({
  locales: ["ms", "en"],
  defaultLocale: "ms",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
