import { describe, expect, it } from "vitest";

import { profileFormSchema, slugSchema } from "@/features/profiles/schemas";
import { DEFAULT_THEME } from "@/lib/profile-theme";

const issue = (input: string) => {
  const result = slugSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
};

describe("slugSchema", () => {
  it("accepts and lowercases valid slugs", () => {
    expect(slugSchema.parse(" Ahmad-Ali ")).toBe("ahmad-ali");
    expect(slugSchema.parse("abc")).toBe("abc");
    expect(slugSchema.parse("a".repeat(30))).toHaveLength(30);
  });

  it("rejects bad slugs with a specific code", () => {
    expect(issue("ab")).toBe("slugTooShort");
    expect(issue("a".repeat(31))).toBe("slugTooLong");
    expect(issue("-abc")).toBe("slugFormat");
    expect(issue("abc-")).toBe("slugFormat");
    expect(issue("ab c")).toBe("slugFormat");
    expect(issue("ahmad_ali")).toBe("slugFormat");
  });

  it("blocks reserved words", () => {
    expect(issue("admin")).toBe("slugReserved");
    expect(issue("Dashboard")).toBe("slugReserved");
  });
});

describe("profileFormSchema", () => {
  const base = {
    slug: "ahmad",
    displayName: "Ahmad",
    jobTitle: "",
    company: "",
    bio: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    address: "",
    mapsUrl: "",
    isPublished: true,
    allowIndexing: false,
    leadFormEnabled: false,
    theme: DEFAULT_THEME,
  };

  it("turns empty optional fields into null", () => {
    const parsed = profileFormSchema.parse(base);
    expect(parsed.phone).toBeNull();
    expect(parsed.website).toBeNull();
  });

  it("validates phone, email and URLs", () => {
    const result = profileFormSchema.safeParse({
      ...base,
      phone: "12",
      email: "nope",
      website: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message).sort();
    expect(messages).toEqual(["invalidEmail", "invalidPhone", "invalidUrl"]);
  });
});
