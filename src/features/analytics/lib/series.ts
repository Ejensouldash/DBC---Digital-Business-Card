import type { TapSource } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/locale";

export const TAP_SOURCES = ["nfc", "qr", "link"] as const satisfies readonly TapSource[];

export type DailyTaps = { day: string } & Record<TapSource, number>;
export type DailyTapRow = { day: string; source: TapSource; taps: number };

// "YYYY-MM-DD" for `date` in Malaysian time, so "today" matches the owner's calendar.
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// One entry per day for the last `days` days (oldest first), zeros where nothing happened.
export function buildDailySeries(rows: DailyTapRow[], days: number, now = new Date()): DailyTaps[] {
  const byDay = new Map<string, DailyTaps>();
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = dayKey(new Date(now.getTime() - offset * 86_400_000));
    byDay.set(day, { day, nfc: 0, qr: 0, link: 0 });
  }
  for (const row of rows) {
    const entry = byDay.get(row.day);
    if (entry) entry[row.source] += row.taps;
  }
  return [...byDay.values()];
}

export function sumSeries(series: DailyTaps[], lastDays = series.length) {
  const totals = { nfc: 0, qr: 0, link: 0, all: 0 };
  for (const entry of series.slice(-lastDays)) {
    for (const source of TAP_SOURCES) {
      totals[source] += entry[source];
      totals.all += entry[source];
    }
  }
  return totals;
}
