import { describe, expect, it } from "vitest";

import {
  CARD_CODE_ALPHABET,
  CARD_CODE_LENGTH,
  cardCodeSchema,
  cardUrl,
  generateCardCode,
} from "@/lib/card-code";

describe("generateCardCode", () => {
  it("produces 8 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateCardCode();
      expect(code).toHaveLength(CARD_CODE_LENGTH);
      for (const char of code) expect(CARD_CODE_ALPHABET).toContain(char);
    }
  });

  it("never uses ambiguous characters", () => {
    const codes = Array.from({ length: 500 }, () => generateCardCode()).join("");
    expect(codes).not.toMatch(/[01ILO]/);
  });

  it("rejects biased bytes instead of wrapping them", () => {
    // 248+ would bias the modulo; the generator must skip them.
    let call = 0;
    const fill = (bytes: Uint8Array<ArrayBuffer>) => {
      bytes.fill(call++ === 0 ? 255 : 0);
      return bytes;
    };
    expect(generateCardCode(fill)).toBe("22222222");
  });

  it("is effectively unique", () => {
    const codes = new Set(Array.from({ length: 2000 }, () => generateCardCode()));
    expect(codes.size).toBe(2000);
  });
});

describe("cardCodeSchema", () => {
  it("normalises case and whitespace", () => {
    expect(cardCodeSchema.parse("  abcd2345 ")).toBe("ABCD2345");
  });

  it("rejects bad codes", () => {
    for (const bad of ["ABCD234", "ABCD23450", "ABCD234O", "abcd-234", ""]) {
      expect(cardCodeSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("cardUrl", () => {
  it("joins without double slashes", () => {
    expect(cardUrl("https://dbc.test/", "ABCD2345")).toBe("https://dbc.test/c/ABCD2345");
  });
});
