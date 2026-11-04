import { describe, expect, it } from "vitest";

import { optimizeImageForOcr } from "@/features/scanner/lib/image";

describe("optimizeImageForOcr", () => {
  it("gracefully falls back when canvas is unavailable (Node/SSR)", async () => {
    const file = new File(["dummy content"], "card.jpg", { type: "image/jpeg" });
    const result = await optimizeImageForOcr(file);

    expect(result.file).toBeDefined();
    expect(result.file.name).toBe("card.jpg");
    expect(result.dataUrl).toBeDefined();
  });
});
