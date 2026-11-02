import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Aurora } from "@/components/shared/aurora";
import { StatusMessage } from "@/components/shared/status-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaimCardForm } from "@/features/cards/components/claim-card-form";
import { OnboardingForm } from "@/features/cards/components/onboarding-form";
import { resolveCard } from "@/features/cards/queries";
import { listOwnerProfiles } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/session";
import { cardCodeSchema } from "@/lib/card-code";
import { env } from "@/lib/env";

export const metadata: Metadata = { robots: { index: false } };

// Reads the session and redirects, so it renders at request time.
export const instant = false;

export default async function ActivatePage({ params }: PageProps<"/activate/[code]">) {
  const { code: rawCode } = await params;
  const user = await requireUser(`/activate/${rawCode}`);
  const t = await getTranslations("Activate");
  const parsed = cardCodeSchema.safeParse(rawCode);
  const card = parsed.success ? await resolveCard(parsed.data) : null;

  if (!parsed.success || !card) {
    return <StatusMessage title={t("errors.not_found")} description={t("notFoundHint")} />;
  }
  if (card.status !== "unclaimed") {
    const isMine = card.ownerId === user.id;
    return (
      <StatusMessage
        title={
          isMine
            ? t("alreadyYoursTitle")
            : t(`errors.${card.status === "disabled" ? "disabled" : "already_claimed"}`)
        }
        description={isMine ? t("alreadyYoursDescription") : t("contactSupport")}
        action={
          <Button asChild>
            <Link href="/dashboard">{t("goToDashboard")}</Link>
          </Button>
        }
      />
    );
  }

  const code = parsed.data;
  const ownerProfiles = await listOwnerProfiles(user.id);
  const isFirstProfile = ownerProfiles.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-md grow flex-col justify-center px-4 py-12">
      <Aurora />
      <Card className="animate-rise rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl">
            <h1>{isFirstProfile ? t("onboardingTitle") : t("title")}</h1>
          </CardTitle>
          <CardDescription>
            {t("description", { code })} {t("signedInAs", { email: user.email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFirstProfile ? (
            <OnboardingForm
              code={code}
              defaultName={user.name}
              profileBaseUrl={`${env.NEXT_PUBLIC_SITE_URL}/p/`}
            />
          ) : (
            <ClaimCardForm code={code} profiles={ownerProfiles} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
