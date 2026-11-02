import { describe, expect, it } from "vitest";

import { leadFormSchema, type LeadFormInput } from "@/features/leads/schemas";

const base: LeadFormInput = {
  name: "Aminah",
  phone: "012-345 6789",
  email: "",
  company: "",
  message: "",
  consent: true,
  fax: "",
};

const issues = (input: LeadFormInput) =>
  leadFormSchema.safeParse(input).error?.issues.map((issue) => issue.message) ?? [];

describe("leadFormSchema", () => {
  it("accepts a name with a phone number and turns blanks into null", () => {
    const parsed = leadFormSchema.parse(base);
    expect(parsed).toMatchObject({ name: "Aminah", email: null, company: null, message: null });
  });

  it("needs consent", () => {
    expect(issues({ ...base, consent: false })).toContain("consentRequired");
  });

  it("needs a phone number or an email address", () => {
    expect(issues({ ...base, phone: "" })).toContain("contactRequired");
    expect(issues({ ...base, phone: "", email: "a@example.com" })).toEqual([]);
  });

  it("validates the phone and email formats", () => {
    expect(issues({ ...base, phone: "abc" })).toContain("invalidPhone");
    expect(issues({ ...base, email: "not-an-email" })).toContain("invalidEmail");
  });

  it("lets a filled honeypot through validation (the action drops it silently)", () => {
    expect(leadFormSchema.safeParse({ ...base, fax: "spam" }).success).toBe(true);
  });
});
