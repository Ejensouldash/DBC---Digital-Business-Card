import { ExternalLinkIcon, PencilIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FlashToast } from "@/components/shared/flash-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnerCardCount } from "@/features/cards/queries";
import { listOwnerProfiles } from "@/features/profiles/queries";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage({ searchParams }: PageProps<"/[locale]/dashboard">) {
  const [user, { claimed }, t] = await Promise.all([
    requireUser("/dashboard"),
    searchParams,
    getTranslations("Dashboard"),
  ]);
  const [ownerProfiles, cardCount] = await Promise.all([
    listOwnerProfiles(user.id),
    getOwnerCardCount(user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {claimed === "1" ? <FlashToast message={t("claimedToast")} /> : null}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("welcome", { name: user.name || user.email })}
        </h1>
        <p className="text-muted-foreground">{t("activeCards", { count: cardCount })}</p>
      </div>

      <section aria-labelledby="profiles-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="profiles-heading" className="text-lg font-semibold">
            {t("profilesTitle")}
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link href={{ pathname: "/dashboard/profile", query: { new: "1" } }}>
              <PlusIcon aria-hidden />
              {t("createProfile")}
            </Link>
          </Button>
        </div>
        {ownerProfiles.length === 0 ? (
          <p className="text-muted-foreground">{t("noProfiles")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ownerProfiles.map((profile) => (
              <li key={profile.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{profile.displayName}</CardTitle>
                    <CardDescription>/p/{profile.slug}</CardDescription>
                    <CardAction>
                      <Badge variant={profile.isPublished ? "default" : "secondary"}>
                        {profile.isPublished ? t("published") : t("draft")}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button asChild size="sm">
                      <Link
                        href={{ pathname: "/dashboard/profile", query: { profile: profile.id } }}
                      >
                        <PencilIcon aria-hidden />
                        {t("edit")}
                      </Link>
                    </Button>
                    {profile.isPublished ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/p/${profile.slug}`} target="_blank">
                          <ExternalLinkIcon aria-hidden />
                          {t("viewPublic")}
                        </Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
