"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t("label")}
      onClick={() => router.replace(pathname, { locale: nextLocale })}
    >
      <LanguagesIcon aria-hidden />
      {t(nextLocale)}
    </Button>
  );
}
