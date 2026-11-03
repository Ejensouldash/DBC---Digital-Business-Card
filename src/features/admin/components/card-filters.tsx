import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { CardFilter } from "../schemas";

const SELECT_CLASS =
  "h-8 w-full sm:w-auto rounded-lg border border-input bg-background/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CardFiltersProps = { filter: CardFilter; batches: { id: string; name: string }[] };

// A plain GET form: filters live in the URL, so results are shareable and work without JS.
export function CardFilters({ filter, batches }: CardFiltersProps) {
  const t = useTranslations("Admin.cards");

  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-end sm:border-0 sm:bg-transparent sm:p-0"
      role="search"
    >
      <div className="flex flex-1 flex-col gap-1 text-sm sm:max-w-xs">
        <label htmlFor="filter-q" className="text-xs font-semibold sm:text-sm sm:font-medium">
          {t("search")}
        </label>
        <div className="relative">
          <Input
            id="filter-q"
            name="q"
            defaultValue={filter.q ?? ""}
            placeholder="ABCD…"
            className="w-full uppercase pr-8 sm:w-36"
            autoCapitalize="characters"
          />
          <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground sm:hidden" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end sm:gap-3">
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="filter-status" className="text-xs font-semibold sm:text-sm sm:font-medium">
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
          <label htmlFor="filter-batch" className="text-xs font-semibold sm:text-sm sm:font-medium">
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
      </div>

      <Button type="submit" size="sm" className="w-full sm:w-auto">
        {t("apply")}
      </Button>
    </form>
  );
}
