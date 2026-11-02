import { telHref, whatsAppHref } from "@/lib/phone";

export type ContactActionKind = "call" | "whatsapp" | "email" | "website" | "waze" | "maps";
export type ContactAction = { kind: ContactActionKind; href: string };

export type ContactFields = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  mapsUrl: string | null;
};

// Builds the big tap targets on a profile, skipping anything the owner left empty.
export function buildContactActions(profile: ContactFields): ContactAction[] {
  const actions: ContactAction[] = [];
  const call = profile.phone ? telHref(profile.phone) : null;
  const whatsapp = whatsAppHref(profile.whatsapp ?? profile.phone ?? "");

  if (call) actions.push({ kind: "call", href: call });
  if (whatsapp) actions.push({ kind: "whatsapp", href: whatsapp });
  if (profile.email) actions.push({ kind: "email", href: `mailto:${profile.email}` });
  if (profile.website) actions.push({ kind: "website", href: profile.website });
  if (profile.address) {
    const query = encodeURIComponent(profile.address);
    actions.push({ kind: "waze", href: `https://waze.com/ul?q=${query}&navigate=yes` });
  }
  if (profile.mapsUrl || profile.address) {
    const href =
      profile.mapsUrl ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address ?? "")}`;
    actions.push({ kind: "maps", href });
  }
  return actions;
}
