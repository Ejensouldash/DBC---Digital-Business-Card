import { describe, expect, it } from "vitest";

import { telHref, toInternationalDigits, whatsAppHref } from "@/lib/phone";

describe("toInternationalDigits", () => {
  it.each([
    ["012-345 6789", "60123456789"],
    ["0123456789", "60123456789"],
    ["+60 12-345 6789", "60123456789"],
    ["60123456789", "60123456789"],
    ["03-2161 1234", "60321611234"],
    ["+65 9123 4567", "6591234567"],
    ["0065 9123 4567", "6591234567"],
  ])("%s → %s", (input, expected) => {
    expect(toInternationalDigits(input)).toBe(expected);
  });

  it("rejects too-short input", () => {
    expect(toInternationalDigits("123")).toBeNull();
    expect(toInternationalDigits("")).toBeNull();
  });
});

describe("hrefs", () => {
  it("builds tel and wa.me links", () => {
    expect(telHref("012-345 6789")).toBe("tel:+60123456789");
    expect(whatsAppHref("012-345 6789")).toBe("https://wa.me/60123456789");
    expect(whatsAppHref("abc")).toBeNull();
  });
});
