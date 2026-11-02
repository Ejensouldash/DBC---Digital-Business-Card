import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { OwnerStats } from "../queries";

import { TapsChart } from "./taps-chart";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>
          {/* Inner span: the small-card title style would otherwise shrink the number. */}
          <span className="text-3xl font-semibold tabular-nums">{value}</span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export function OwnerStatsSection({ stats }: { stats: OwnerStats }) {
  const t = useTranslations("Analytics");

  return (
    <section aria-labelledby="stats-heading" className="flex flex-col gap-4">
      <h2 id="stats-heading" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label={t("taps7")} value={stats.last7.all} />
        <StatTile label={t("taps30")} value={stats.last30.all} />
        <StatTile label={t("leads30")} value={stats.leads30} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("chartTitle")}</CardTitle>
          <CardDescription>{t("chartDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.last30.all === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <TapsChart data={stats.daily} totals={stats.last30} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
