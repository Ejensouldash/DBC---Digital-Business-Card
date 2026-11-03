import { NfcIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { OwnerCardItem } from "@/features/cards/components/owner-card-item";
import { RegisterCardDialog } from "@/features/cards/components/register-card-dialog";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} description={t("description")} />
        <RegisterCardDialog profiles={profiles} />
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <NfcIcon className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-semibold text-foreground">No cards registered yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Have an NFC card or tag? Register it here to generate a tracking link and write it to
              your chip, or tap a pre-configured card to activate it.
            </p>
          </div>
          <RegisterCardDialog profiles={profiles} />
        </div>
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
