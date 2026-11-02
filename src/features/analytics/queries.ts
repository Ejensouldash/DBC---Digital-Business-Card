import "server-only";

import { and, count, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, profiles, tapEvents } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/locale";

import { buildDailySeries, sumSeries, type DailyTapRow, type DailyTaps } from "./lib/series";

const WINDOW_DAYS = 30;

export type OwnerStats = {
  daily: DailyTaps[];
  last7: ReturnType<typeof sumSeries>;
  last30: ReturnType<typeof sumSeries>;
  leads30: number;
};

// Taps and leads across all of the owner's profiles for the last 30 days.
export async function getOwnerStats(ownerId: string): Promise<OwnerStats> {
  const since = sql`now() - make_interval(days => ${WINDOW_DAYS})`;
  const day = sql<string>`to_char(${tapEvents.createdAt} at time zone ${APP_TIME_ZONE}, 'YYYY-MM-DD')`;

  const [rows, [leadRow]] = await Promise.all([
    db
      .select({ day, source: tapEvents.source, taps: count() })
      .from(tapEvents)
      .innerJoin(profiles, eq(profiles.id, tapEvents.profileId))
      .where(and(eq(profiles.ownerId, ownerId), gte(tapEvents.createdAt, since)))
      // By position: the time zone is a bind parameter, so repeating `day` here would be a
      // different expression to Postgres ($1 vs $4) and fail the GROUP BY check.
      .groupBy(sql`1`, sql`2`),
    db
      .select({ total: count() })
      .from(leads)
      .innerJoin(profiles, eq(profiles.id, leads.profileId))
      .where(and(eq(profiles.ownerId, ownerId), gte(leads.createdAt, since))),
  ]);

  const daily = buildDailySeries(rows satisfies DailyTapRow[], WINDOW_DAYS);
  return {
    daily,
    last7: sumSeries(daily, 7),
    last30: sumSeries(daily),
    leads30: leadRow?.total ?? 0,
  };
}
