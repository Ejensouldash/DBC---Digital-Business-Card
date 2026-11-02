import { describe, expect, it } from "vitest";

import { batchCsv, batchFilename } from "@/features/admin/lib/create-batch";

describe("batchCsv", () => {
  it("lists the chip URL and QR URL for every code", () => {
    expect(batchCsv("https://dbc.test/", ["ABCD2345", "WXYZ6789"])).toBe(
      "code,url,qr_url\r\n" +
        "ABCD2345,https://dbc.test/c/ABCD2345,https://dbc.test/c/ABCD2345?src=qr\r\n" +
        "WXYZ6789,https://dbc.test/c/WXYZ6789,https://dbc.test/c/WXYZ6789?src=qr\r\n",
    );
  });
});

describe("batchFilename", () => {
  it("makes a safe file name", () => {
    expect(batchFilename("Batch Nov 2026")).toBe("batch-nov-2026.csv");
    expect(batchFilename("../../etc")).toBe("etc.csv");
    expect(batchFilename("!!!")).toBe("batch.csv");
  });
});
