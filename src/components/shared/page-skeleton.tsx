import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

// Placeholder for a page body while its request-time data streams in. Used by loading.tsx,
// which lets navigations between signed-in pages show something immediately.
export async function PageSkeleton() {
  const t = await getTranslations("Meta");

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{t("loading")}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
