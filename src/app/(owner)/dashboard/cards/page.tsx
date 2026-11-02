import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { OwnerCardItem } from "@/features/cards/components/owner-card-item";
import { listOwnerCards } from "@/features/cards/queries";
import { listOwnerProfiles } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/session";
import { cardUrl } from "@/lib/card-code";
import { env } from "@/lib/env";

export default async function CardsPage() {
  const [user, t] = await Promise.all([requireUser("/dashboard/cards"), getTranslations("Cards")]);
  const [cards, profiles] = await Promise.all([
    listOwnerCards(user.id),
    listOwnerProfiles(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {cards.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card) => (
            <li key={card.id}>
              <OwnerCardItem
                card={card}
                profiles={profiles}
                cardUrl={cardUrl(env.NEXT_PUBLIC_SITE_URL, card.code)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
