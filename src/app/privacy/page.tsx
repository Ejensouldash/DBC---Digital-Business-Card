import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";

import { Aurora } from "@/components/shared/aurora";
import { env } from "@/lib/env";

const SECTIONS = ["collect", "use", "share", "keep", "rights", "security", "contact"] as const;

// PDPA s.7(3) requires the notice in both the national language and English, so this page
// carries both even though the rest of the UI is English only.
const NOTICES = [
  { lang: "en", id: "english" },
  { lang: "ms", id: "bahasa-melayu" },
] as const;

const RICH = {
  p: (chunks: ReactNode) => <p>{chunks}</p>,
  ul: (chunks: ReactNode) => <ul className="list-disc space-y-2 pl-5">{chunks}</ul>,
  li: (chunks: ReactNode) => <li>{chunks}</li>,
  b: (chunks: ReactNode) => <strong className="font-medium">{chunks}</strong>,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return { title: t("en.title"), alternates: { canonical: "/privacy" } };
}

async function Notice({ lang, id }: (typeof NOTICES)[number]) {
  const t = await getTranslations(`Privacy.${lang}`);
  const email = env.CONTACT_EMAIL;

  return (
    <section
      lang={lang}
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-6 rounded-3xl glass p-6 sm:p-8"
    >
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("updated")}</p>
      </header>
      <p>{t("intro")}</p>
      {SECTIONS.map((section) => (
        <section
          key={section}
          id={section === "contact" && lang === "en" ? "contact" : undefined}
          className="flex flex-col gap-2"
        >
          <h3 className="text-lg font-medium">{t(`sections.${section}.title`)}</h3>
          <div className="flex flex-col gap-2 text-sm leading-relaxed">
            {t.rich(`sections.${section}.body`, RICH)}
          </div>
          {section === "contact" ? (
            <p className="text-sm">
              {email
                ? t.rich("email", {
                    email,
                    link: (chunks) => (
                      <a href={`mailto:${email}`} className="underline">
                        {chunks}
                      </a>
                    ),
                  })
                : t("noEmail")}
            </p>
          ) : null}
        </section>
      ))}
    </section>
  );
}

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  return (
    <main className="mx-auto flex w-full max-w-2xl grow flex-col gap-10 px-4 py-10">
      <Aurora />
      <h1 className="text-3xl font-semibold tracking-tight">{t("heading")}</h1>
      <nav aria-label={t("languages")} className="flex gap-4 text-sm">
        <Link href="#english" className="underline">
          {t("english")}
        </Link>
        <Link href="#bahasa-melayu" className="underline">
          {t("malay")}
        </Link>
      </nav>
      {NOTICES.map((notice) => (
        <Notice key={notice.lang} {...notice} />
      ))}
    </main>
  );
}
