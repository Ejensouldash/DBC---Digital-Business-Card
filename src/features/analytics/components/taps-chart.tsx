"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TapSource } from "@/lib/db/schema";

import { TAP_SOURCES, type DailyTaps } from "../lib/series";

// Fixed order, so a source keeps its color everywhere.
const SERIES_COLOR: Record<TapSource, string> = {
  nfc: "var(--series-1)",
  qr: "var(--series-2)",
  link: "var(--series-3)",
};

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatDay = (day: string) => shortDate.format(new Date(`${day}T00:00:00Z`));

type TapsChartProps = { data: DailyTaps[]; totals: Record<TapSource, number> };

export function TapsChart({ data, totals }: TapsChartProps) {
  const t = useTranslations("Analytics");

  return (
    <figure className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label={t("legend")}>
        {TAP_SOURCES.map((source) => (
          <li key={source} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: SERIES_COLOR[source] }}
              aria-hidden
            />
            <span className="text-muted-foreground">{t(`sources.${source}`)}</span>
            <span className="font-medium tabular-nums">{totals[source]}</span>
          </li>
        ))}
      </ul>
      <div className="h-56 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
            barCategoryGap="25%"
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              labelFormatter={(day) => formatDay(String(day))}
              formatter={(value, name) => [value, t(`sources.${name as TapSource}`)]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
            {TAP_SOURCES.map((source, index) => (
              <Bar
                key={source}
                dataKey={source}
                stackId="taps"
                fill={SERIES_COLOR[source]}
                maxBarSize={24}
                // 2px surface-colored gap between stacked segments; rounded data-end on top only.
                stroke="var(--card)"
                strokeWidth={2}
                radius={index === TAP_SOURCES.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{t("chartCaption")}</figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">{t("day")}</th>
            {TAP_SOURCES.map((source) => (
              <th key={source} scope="col">
                {t(`sources.${source}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data
            .filter((row) => row.nfc + row.qr + row.link > 0)
            .map((row) => (
              <tr key={row.day}>
                <th scope="row">{formatDay(row.day)}</th>
                <td>{row.nfc}</td>
                <td>{row.qr}</td>
                <td>{row.link}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}
