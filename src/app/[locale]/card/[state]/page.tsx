import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { StatusMessage } from "@/components/shared/status-message";
import { routing } from "@/i18n/routing";

const STATES = ["invalid", "inactive"] as const;
type CardState = (typeof STATES)[number];

function isCardState(value: string): value is CardState {
  return (STATES as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => STATES.map((state) => ({ locale, state })));
}

export const metadata: Metadata = { robots: { index: false } };

export default async function CardStatePage({ params }: PageProps<"/[locale]/card/[state]">) {
  const { state } = await params;
  if (!isCardState(state)) notFound();

  const t = await getTranslations("CardState");
  return <StatusMessage title={t(`${state}.title`)} description={t(`${state}.description`)} />;
}
