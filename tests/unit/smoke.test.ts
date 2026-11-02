import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("toolchain", () => {
  it("resolves the @/ alias", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
