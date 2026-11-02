import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { CardFilter } from "../schemas";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CardFiltersProps = { filter: CardFilter; batches: { id: string; name: string }[] };

// A plain GET form: filters live in the URL, so results are shareable and work without JS.
export function CardFilters({ filter, batches }: CardFiltersProps) {
  const t = useTranslations("Admin.cards");

  return (
    <form method="get" className="flex flex-wrap items-end gap-3" role="search">
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="filter-q" className="font-medium">
          {t("search")}
        </label>
        <Input
          id="filter-q"
          name="q"
          defaultValue={filter.q ?? ""}
          placeholder="ABCD…"
          className="w-36 uppercase"
          autoCapitalize="characters"
        />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="filter-status" className="font-medium">
          {t("statusFilter")}
        </label>
        <select
          id="filter-status"
          name="status"
          defaultValue={filter.status ?? ""}
          className={SELECT_CLASS}
        >
          <option value="">{t("all")}</option>
          <option value="unclaimed">{t("status.unclaimed")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="disabled">{t("status.disabled")}</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="filter-batch" className="font-medium">
          {t("batchFilter")}
        </label>
        <select
          id="filter-batch"
          name="batch"
          defaultValue={filter.batch ?? ""}
          className={SELECT_CLASS}
        >
          <option value="">{t("all")}</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm">
        {t("apply")}
      </Button>
    </form>
  );
}
