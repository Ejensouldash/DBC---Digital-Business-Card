"use client";

import { CopyIcon, NfcIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { QrCode } from "@/components/shared/qr-code";
import { QrDownloadButtons } from "@/components/shared/qr-download-buttons";
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
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { OwnerProfileSummary } from "@/features/profiles/queries";
import type { ActionResult } from "@/lib/action-result";

import { pointCardAtProfile, renameCard, setCardEnabled, type OwnerCardError } from "../actions";
import type { OwnerCard } from "../queries";

type OwnerCardItemProps = {
  card: OwnerCard;
  profiles: OwnerProfileSummary[];
  cardUrl: string;
};

export function OwnerCardItem({ card, profiles, cardUrl }: OwnerCardItemProps) {
  const t = useTranslations("Cards");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(card.label ?? "");
  const title = card.label || t("untitled");
  const qrUrl = `${cardUrl}?src=qr`;

  function save(action: () => Promise<ActionResult<undefined, OwnerCardError>>, done?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      if (done) toast.success(done);
      router.refresh();
    });
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(cardUrl);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NfcIcon className="size-4 text-muted-foreground" aria-hidden />
          {editing ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setEditing(false);
                save(() => renameCard(card.id, label), t("renamed"));
              }}
            >
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={50}
                aria-label={t("labelField")}
                autoFocus
                className="h-8 w-48"
              />
              <Button type="submit" size="sm" disabled={pending}>
                {t("saveLabel")}
              </Button>
            </form>
          ) : (
            <>
              {title}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(true)}
                aria-label={t("rename", { name: title })}
              >
                <PencilIcon aria-hidden />
              </Button>
            </>
          )}
        </CardTitle>
        <CardDescription>{t("meta", { code: card.code, taps: card.taps })}</CardDescription>
        <CardAction>
          <Badge variant={card.status === "active" ? "default" : "secondary"}>
            {t(`status.${card.status}`)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor={`profile-${card.id}`}>{t("opens")}</FieldLabel>
            <Select
              value={card.profileId ?? undefined}
              onValueChange={(profileId) =>
                save(() => pointCardAtProfile(card.id, profileId), t("pointed"))
              }
              disabled={pending}
            >
              <SelectTrigger id={`profile-${card.id}`} className="w-full sm:w-72">
                <SelectValue placeholder={t("noProfile")} />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.displayName} (/{profile.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={`enabled-${card.id}`}>{t("enabled")}</FieldLabel>
              <FieldDescription>{t("enabledHint")}</FieldDescription>
            </FieldContent>
            <Switch
              id={`enabled-${card.id}`}
              checked={card.status === "active"}
              disabled={pending}
              onCheckedChange={(enabled) =>
                save(
                  () => setCardEnabled(card.id, enabled),
                  enabled ? t("enabledToast") : t("disabledToast"),
                )
              }
            />
          </Field>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t("cardUrl")}</p>
            <div className="flex items-center gap-2">
              <code className="truncate rounded-md bg-muted px-2 py-1 text-xs">{cardUrl}</code>
              <Button variant="ghost" size="icon-sm" onClick={copyUrl} aria-label={t("copy")}>
                <CopyIcon aria-hidden />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <QrCode value={qrUrl} size={140} label={t("qrLabel", { code: card.code })} />
          <QrDownloadButtons
            value={qrUrl}
            filename={`card-${card.code}`}
            labels={{ png: "PNG", svg: "SVG", failed: t("qrFailed") }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
