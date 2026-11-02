import { describe, expect, it } from "vitest";

import { buildContactActions, type ContactFields } from "@/features/profiles/lib/contact-actions";

const empty: ContactFields = {
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  address: null,
  mapsUrl: null,
};

describe("buildContactActions", () => {
  it("returns nothing for an empty profile", () => {
    expect(buildContactActions(empty)).toEqual([]);
  });

  it("uses the phone for WhatsApp when no WhatsApp number is set", () => {
    const actions = buildContactActions({ ...empty, phone: "012-345 6789" });
    expect(actions).toEqual([
      { kind: "call", href: "tel:+60123456789" },
      { kind: "whatsapp", href: "https://wa.me/60123456789" },
    ]);
  });

  it("prefers a dedicated WhatsApp number", () => {
    const actions = buildContactActions({ ...empty, phone: "0123456789", whatsapp: "0198765432" });
    expect(actions.find((a) => a.kind === "whatsapp")?.href).toBe("https://wa.me/60198765432");
  });

  it("builds Waze and Maps links from the address", () => {
    const actions = buildContactActions({ ...empty, address: "KLCC, Kuala Lumpur" });
    expect(actions).toEqual([
      { kind: "waze", href: "https://waze.com/ul?q=KLCC%2C%20Kuala%20Lumpur&navigate=yes" },
      {
        kind: "maps",
        href: "https://www.google.com/maps/search/?api=1&query=KLCC%2C%20Kuala%20Lumpur",
      },
    ]);
  });

  it("uses an explicit Maps URL when given", () => {
    const actions = buildContactActions({ ...empty, mapsUrl: "https://maps.app.goo.gl/abc" });
    expect(actions).toEqual([{ kind: "maps", href: "https://maps.app.goo.gl/abc" }]);
  });
});
