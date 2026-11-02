import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("writes a header and rows with CRLF", () => {
    expect(toCsv(["code", "url"], [["ABCD2345", "https://x.test/c/ABCD2345"]])).toBe(
      "code,url\r\nABCD2345,https://x.test/c/ABCD2345\r\n",
    );
  });

  it("quotes commas, quotes and newlines", () => {
    expect(toCsv(["v"], [["a,b"], ['say "hi"'], ["line1\nline2"]])).toBe(
      'v\r\n"a,b"\r\n"say ""hi"""\r\n"line1\nline2"\r\n',
    );
  });

  it("renders empty values and dates", () => {
    const date = new Date("2026-11-02T03:00:00.000Z");
    expect(toCsv(["a", "b", "c"], [[null, undefined, date]])).toBe(
      "a,b,c\r\n,,2026-11-02T03:00:00.000Z\r\n",
    );
  });

  it("neutralises formula injection", () => {
    expect(toCsv(["name"], [['=HYPERLINK("x")'], ["+60123"], ["-1"], ["@cmd"]])).toBe(
      'name\r\n"\'=HYPERLINK(""x"")"\r\n\'+60123\r\n\'-1\r\n\'@cmd\r\n',
    );
  });
});
