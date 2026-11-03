import { describe, expect, it } from "vitest";

import { cardDesignSchema, saveScannedLeadSchema } from "@/features/scanner/schemas";

describe("cardDesignSchema", () => {
  it("validates valid hex color codes", () => {
    const valid = {
      dominantColor: "#0f172a",
      accentColor: "#6366f1",
      textColor: "#ffffff",
      styleTheme: "dark" as const,
    };
    const result = cardDesignSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex codes", () => {
    const invalid = {
      dominantColor: "not-a-color",
      textColor: "#ffffff",
    };
    const result = cardDesignSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("saveScannedLeadSchema", () => {
  const validPayload = {
    profileId: "123e4567-e89b-12d3-a456-426614174000",
    name: "John Smith",
    company: "Tech Corp",
    jobTitle: "Founder & CEO",
    phone: "+60123456789",
    email: "john@techcorp.com",
    website: "https://techcorp.com",
    address: "Menara 1, KL",
    notes: "Follow up next week",
    cardDesign: {
      dominantColor: "#111827",
      textColor: "#f9fafb",
    },
  };

  it("passes for complete valid data", () => {
    const result = saveScannedLeadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("requires a non-empty name", () => {
    const result = saveScannedLeadSchema.safeParse({
      ...validPayload,
      name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("requires a valid profile UUID", () => {
    const result = saveScannedLeadSchema.safeParse({
      ...validPayload,
      profileId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("permits empty string or valid format for email and website", () => {
    const withEmpty = saveScannedLeadSchema.safeParse({
      ...validPayload,
      email: "",
      website: "",
    });
    expect(withEmpty.success).toBe(true);
  });
});
