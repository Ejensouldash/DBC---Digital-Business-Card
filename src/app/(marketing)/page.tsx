import { NfcIcon, UserPlusIcon, ZapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const FEATURES = [
  { key: "tap", Icon: NfcIcon },
  { key: "save", Icon: UserPlusIcon },
  { key: "update", Icon: ZapIcon },
] as const;

export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <div className="flex grow flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <span className="font-semibold">{t("brand")}</span>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("login")}</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl grow flex-col justify-center gap-12 px-4 py-16">
        <section className="flex max-w-2xl flex-col gap-5">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">{t("subtitle")}</p>
          <div>
            <Button asChild size="lg">
              <Link href="/dashboard">{t("cta")}</Link>
            </Button>
          </div>
        </section>
        <ul className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ key, Icon }) => (
            <li key={key} className="flex flex-col gap-2 rounded-xl border p-5">
              <Icon className="size-6 text-primary" aria-hidden />
              <h2 className="font-medium">{t(`features.${key}.title`)}</h2>
              <p className="text-sm text-muted-foreground">{t(`features.${key}.description`)}</p>
            </li>
          ))}
        </ul>
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:underline">
          {t("privacy")}
        </Link>
      </footer>
    </div>
  );
}
