import { ArrowRightIcon, NfcIcon, UserPlusIcon, ZapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Aurora } from "@/components/shared/aurora";
import { MotionProvider } from "@/components/shared/motion-provider";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { HeroHeadline } from "@/features/marketing/components/hero-headline";
import { NfcCardMockup } from "@/features/marketing/components/nfc-card-mockup";

const FEATURES = [
  { key: "tap", Icon: NfcIcon },
  { key: "save", Icon: UserPlusIcon },
  { key: "update", Icon: ZapIcon },
] as const;

export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <MotionProvider>
      <Aurora />
      <div className="flex grow flex-col">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#070b1a]/60 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="size-3 rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 shadow-[0_0_12px_rgb(167_139_250/0.8)]"
              />
              {t("brand")}
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl grow flex-col gap-24 px-4 py-16 sm:py-24">
          <section className="grid items-center gap-14 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-sm text-violet-100">
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/70" />
                    <span className="relative size-2 rounded-full bg-cyan-300" />
                  </span>
                  {t("eyebrow")}
                </span>
              </Reveal>
              <HeroHeadline text={t("title")} />
              <Reveal delay={0.5}>
                <p className="max-w-xl text-lg text-pretty text-muted-foreground">
                  {t("subtitle")}
                </p>
              </Reveal>
              <Reveal delay={0.65}>
                <Button asChild size="lg" className="sheen h-12 rounded-xl px-6 text-base glow">
                  <Link href="/dashboard">
                    {t("cta")}
                    <ArrowRightIcon aria-hidden />
                  </Link>
                </Button>
              </Reveal>
            </div>
            <Reveal delay={0.3}>
              <NfcCardMockup />
            </Reveal>
          </section>

          <ul className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ key, Icon }, i) => (
              <li key={key}>
                <Reveal inView delay={i * 0.12} className="h-full">
                  <div className="flex h-full lift flex-col gap-3 rounded-2xl glass p-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 ring-1 ring-white/15">
                      <Icon className="size-5 text-violet-200" aria-hidden />
                    </span>
                    <h2 className="font-medium">{t(`features.${key}.title`)}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t(`features.${key}.description`)}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>

          <Reveal inView>
            <section className="relative overflow-hidden rounded-3xl glass px-6 py-12 text-center sm:px-12">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(124_58_237/0.35),transparent_65%)]"
              />
              <div className="relative flex flex-col items-center gap-5">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  {t("ctaTitle")}
                </h2>
                <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base glow">
                  <Link href="/dashboard">{t("cta")}</Link>
                </Button>
              </div>
            </section>
          </Reveal>
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            {t("privacy")}
          </Link>
        </footer>
      </div>
    </MotionProvider>
  );
}
