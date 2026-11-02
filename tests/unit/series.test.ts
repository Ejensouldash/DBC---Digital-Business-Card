import { describe, expect, it } from "vitest";

import { buildDailySeries, dayKey, sumSeries } from "@/features/analytics/lib/series";

// 2026-11-02 01:00 in Kuala Lumpur (UTC+8) is still 2026-11-01 in UTC.
const NOW = new Date("2026-11-01T17:00:00.000Z");

describe("dayKey", () => {
  it("uses Malaysian calendar days", () => {
    expect(dayKey(NOW)).toBe("2026-11-02");
  });
});

describe("buildDailySeries", () => {
  it("fills every day with zeros, oldest first", () => {
    const series = buildDailySeries([], 3, NOW);
    expect(series.map((d) => d.day)).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(series.every((d) => d.nfc + d.qr + d.link === 0)).toBe(true);
  });

  it("places rows on their day and ignores days outside the window", () => {
    const series = buildDailySeries(
      [
        { day: "2026-11-02", source: "nfc", taps: 3 },
        { day: "2026-11-02", source: "qr", taps: 1 },
        { day: "2026-11-01", source: "link", taps: 2 },
        { day: "2026-09-01", source: "nfc", taps: 99 },
      ],
      3,
      NOW,
    );
    expect(series.at(-1)).toEqual({ day: "2026-11-02", nfc: 3, qr: 1, link: 0 });
    expect(series.at(-2)).toEqual({ day: "2026-11-01", nfc: 0, qr: 0, link: 2 });
  });
});

describe("sumSeries", () => {
  it("totals all days or only the most recent ones", () => {
    const series = buildDailySeries(
      [
        { day: "2026-10-31", source: "nfc", taps: 5 },
        { day: "2026-11-02", source: "link", taps: 1 },
      ],
      3,
      NOW,
    );
    expect(sumSeries(series)).toEqual({ nfc: 5, qr: 0, link: 1, all: 6 });
    expect(sumSeries(series, 1)).toEqual({ nfc: 0, qr: 0, link: 1, all: 1 });
  });
});
