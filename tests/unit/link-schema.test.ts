import { describe, expect, it } from "vitest";

import { linkFormSchema } from "@/features/links/schemas";

describe("linkFormSchema", () => {
  it("adds https:// when the scheme is missing", () => {
    const parsed = linkFormSchema.parse({
      type: "instagram",
      label: "",
      url: "instagram.com/siti",
    });
    expect(parsed).toEqual({ type: "instagram", label: null, url: "https://instagram.com/siti" });
  });

  it("keeps explicit http(s) URLs", () => {
    expect(
      linkFormSchema.parse({ type: "custom", label: "Shop", url: "http://shop.test" }).url,
    ).toBe("http://shop.test");
  });

  it("rejects other schemes and empty URLs", () => {
    for (const url of ["javascript:alert(1)", "ftp://x.test", ""]) {
      expect(linkFormSchema.safeParse({ type: "custom", label: "", url }).success).toBe(false);
    }
  });

  it("rejects unknown link types", () => {
    expect(linkFormSchema.safeParse({ type: "myspace", label: "", url: "x.test" }).success).toBe(
      false,
    );
  });
});
