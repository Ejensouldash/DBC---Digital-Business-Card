import { describe, expect, it } from "vitest";

import { buildVCard, escapeText, foldLine, type VCardProfile } from "@/lib/vcard";

const profile: VCardProfile = {
  displayName: "Ahmad bin Ali",
  jobTitle: "Pengurus, Jualan",
  company: "Syarikat ABC; Sdn Bhd",
  bio: "Line one\nLine two",
  phone: "012-345 6789",
  email: "ahmad@example.com",
  website: "https://example.com",
  address: "No 1, Jalan Ampang\nKuala Lumpur",
  officePhone: null,
  companyWebsite: null,
  profileUrl: "https://dbc.test/p/ahmad",
};

describe("escapeText", () => {
  it("escapes backslash, comma, semicolon and newlines", () => {
    expect(escapeText("a\\b,c;d\ne\r\nf")).toBe("a\\\\b\\,c\\;d\\ne\\nf");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("FN:Ali")).toBe("FN:Ali");
  });

  it("folds at 75 octets with CRLF + space", () => {
    const folded = foldLine(`NOTE:${"a".repeat(200)}`);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(parts.slice(1).every((p) => p.startsWith(" "))).toBe(true);
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(
      `NOTE:${"a".repeat(200)}`,
    );
  });

  it("never splits a multi-byte character", () => {
    const folded = foldLine(`NOTE:${"é".repeat(100)}`);
    for (const part of folded.split("\r\n")) {
      expect(part).not.toContain("�");
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("buildVCard", () => {
  const card = buildVCard(profile, [{ type: "instagram", url: "https://instagram.com/ahmad" }]);

  it("is vCard 3.0 with CRLF line endings", () => {
    expect(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(card.endsWith("END:VCARD\r\n")).toBe(true);
    expect(card.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("writes the expected fields", () => {
    expect(card).toContain("N:;Ahmad bin Ali;;;\r\n");
    expect(card).toContain("FN:Ahmad bin Ali\r\n");
    expect(card).toContain("ORG:Syarikat ABC\\; Sdn Bhd\r\n");
    expect(card).toContain("TITLE:Pengurus\\, Jualan\r\n");
    expect(card).toContain("TEL;TYPE=CELL:+60123456789\r\n");
    expect(card).toContain("EMAIL;TYPE=INTERNET:ahmad@example.com\r\n");
    expect(card).toContain("URL:https://example.com\r\n");
    expect(card).toContain("X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/ahmad\r\n");
    expect(card).toContain("ADR;TYPE=WORK:;;No 1\\, Jalan Ampang\\nKuala Lumpur;;;;\r\n");
    expect(card).toContain("NOTE:Line one\\nLine two\r\n");
  });

  it("omits empty fields", () => {
    const minimal = buildVCard(
      {
        ...profile,
        jobTitle: null,
        company: null,
        bio: null,
        phone: null,
        email: null,
        website: null,
        address: null,
      },
      [],
    );
    expect(minimal).not.toMatch(/^(ORG|TITLE|TEL|EMAIL|ADR|NOTE)/m);
  });

  it("adds the office phone and company website as work entries", () => {
    const vcard = buildVCard(
      { ...profile, officePhone: "03-2345 6789", companyWebsite: "https://abc.example.com" },
      [],
    );
    expect(vcard).toContain("TEL;TYPE=WORK,VOICE:+60323456789\r\n");
    expect(vcard).toContain("URL;TYPE=WORK:https://abc.example.com\r\n");
  });

  it("embeds and folds a JPEG photo", () => {
    const photo = "A".repeat(500);
    const withPhoto = buildVCard(profile, [], photo);
    expect(withPhoto).toContain("PHOTO;ENCODING=b;TYPE=JPEG:");
    const unfolded = withPhoto.replace(/\r\n /g, "");
    expect(unfolded).toContain(`PHOTO;ENCODING=b;TYPE=JPEG:${photo}\r\n`);
  });
});

describe("buildContactVCard", () => {
  it("builds a complete vCard for a scanned business card", async () => {
    const { buildContactVCard } = await import("@/lib/vcard");
    const vcard = buildContactVCard({
      name: "Iskandar Zulkarnain",
      jobTitle: "Senior Architect",
      company: "Bubbles Technologies",
      phone: "019-876 5432",
      email: "iskandar@example.com",
      website: "https://bubbles.example.com",
      address: "Suite 8, KLCC",
      notes: "Met at Tech Expo",
    });

    expect(vcard).toContain("BEGIN:VCARD\r\nVERSION:3.0\r\n");
    expect(vcard).toContain("FN:Iskandar Zulkarnain\r\n");
    expect(vcard).toContain("TITLE:Senior Architect\r\n");
    expect(vcard).toContain("ORG:Bubbles Technologies\r\n");
    expect(vcard).toContain("TEL;TYPE=CELL:+60198765432\r\n");
    expect(vcard).toContain("EMAIL;TYPE=INTERNET:iskandar@example.com\r\n");
    expect(vcard).toContain("URL:https://bubbles.example.com\r\n");
    expect(vcard).toContain("ADR;TYPE=WORK:;;Suite 8\\, KLCC;;;;\r\n");
    expect(vcard).toContain("NOTE:Met at Tech Expo\r\n");
    expect(vcard).toContain("END:VCARD\r\n");
  });

  it("omits empty or null contact fields cleanly", async () => {
    const { buildContactVCard } = await import("@/lib/vcard");
    const vcard = buildContactVCard({
      name: "Nurul Huda",
      phone: null,
      email: null,
    });

    expect(vcard).toContain("FN:Nurul Huda\r\n");
    expect(vcard).not.toContain("TEL");
    expect(vcard).not.toContain("EMAIL");
    expect(vcard).not.toContain("ORG");
    expect(vcard).not.toContain("TITLE");
  });
});
