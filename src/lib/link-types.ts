// Social/custom link kinds. Shared by the DB enum, Zod schemas and UI.
export const LINK_TYPES = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "x",
  "youtube",
  "telegram",
  "custom",
] as const;

export type LinkType = (typeof LINK_TYPES)[number];
