import { z } from "zod";

import { slugSchema } from "@/features/profiles/schemas";

// Sent by the profile page for visits that did not come through /c/<CODE>.
export const tapBeaconSchema = z.object({
  slug: slugSchema,
  source: z.enum(["qr", "link"]),
});

export type TapBeacon = z.infer<typeof tapBeaconSchema>;
