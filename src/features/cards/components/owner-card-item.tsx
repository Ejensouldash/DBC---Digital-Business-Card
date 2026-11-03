"use client";

import {
  CopyIcon,
  ExternalLinkIcon,
  NfcIcon,
  PencilIcon,
  QrCodeIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const [mobileTab, setMobileTab] = useState<"settings" | "qr">("settings");

  const title = card.label || t("untitled");
  const qrUrl = `${cardUrl}?src=qr`;
  const targetProfile = profiles.find((p) => p.id === card.profileId);

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
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE VIEW (< sm) - Sleek Fintech NFC Card + Tabs
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3.5 rounded-3xl border border-white/10 bg-card/60 p-3.5 shadow-xl backdrop-blur-md sm:hidden">
        {/* Virtual NFC Physical Card Mockup */}
        <div className="relative aspect-[1.8] w-full overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-violet-900/40 via-[#0d122b] to-[#070b1a] p-4 text-white shadow-xl">
          {/* Subtle glow orbs */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-primary/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-36 rounded-full bg-cyan-500/15 blur-2xl" />

          {/* Top Row: Chip + NFC Icon + Status Badge */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-7 items-center justify-center rounded border border-amber-300/40 bg-gradient-to-br from-amber-200/30 to-amber-500/20 shadow-inner">
                <div className="h-2.5 w-3.5 rounded-xs border border-amber-300/30" />
              </div>
              <NfcIcon className="size-4 text-white/70" />
            </div>
            <Badge
              variant={card.status === "active" ? "default" : "secondary"}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
                card.status === "active"
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-zinc-800 text-zinc-400",
              )}
            >
              {t(`status.${card.status}`)}
            </Badge>
          </div>

          {/* Middle Row: Card Name & Linked Profile */}
          <div className="relative my-auto flex flex-col gap-0.5 pt-2">
            {editing ? (
              <form
                className="flex items-center gap-1.5"
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
                  className="h-7 flex-1 border-white/20 bg-black/60 text-xs text-white"
                />
                <Button type="submit" size="sm" disabled={pending} className="h-7 px-2.5 text-xs">
                  {t("saveLabel")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="h-7 px-2 text-xs text-white/70"
                >
                  ✕
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-bold tracking-tight text-white">{title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setEditing(true)}
                  className="size-6 text-white/60 hover:text-white"
                  aria-label={t("rename", { name: title })}
                >
                  <PencilIcon className="size-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <span className="truncate">
                {targetProfile ? `👤 ${targetProfile.displayName}` : t("noProfile")}
              </span>
            </div>
          </div>

          {/* Bottom Row: Card Code & Taps Counter */}
          <div className="relative flex items-end justify-between pt-1 text-xs">
            <code className="font-mono text-xs tracking-wider text-white/80">{card.code}</code>
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-md">
              <span>⚡</span>
              <span>
                {card.taps} {card.taps === 1 ? "tap" : "taps"}
              </span>
            </span>
          </div>
        </div>

        {/* Segmented Mode Switcher (Settings vs QR Code) */}
        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.04] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMobileTab("settings")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all",
              mobileTab === "settings"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontalIcon className="size-3.5" />
            <span>Card Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("qr")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all",
              mobileTab === "qr"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <QrCodeIcon className="size-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Tab 1: Card Settings */}
        {mobileTab === "settings" ? (
          <div className="flex flex-col gap-3 pt-1">
            {/* Target Profile Selector */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <label htmlFor={`profile-mobile-${card.id}`} className="text-xs font-semibold text-foreground">
                {t("opens")}
              </label>
              <Select
                value={card.profileId ?? undefined}
                onValueChange={(profileId) =>
                  save(() => pointCardAtProfile(card.id, profileId), t("pointed"))
                }
                disabled={pending}
              >
                <SelectTrigger id={`profile-mobile-${card.id}`} className="w-full">
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
            </div>

            {/* Card Status Switch */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-col gap-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground">{t("enabled")}</span>
                <span className="text-[11px] text-muted-foreground">{t("enabledHint")}</span>
              </div>
              <Switch
                id={`enabled-mobile-${card.id}`}
                checked={card.status === "active"}
                disabled={pending}
                onCheckedChange={(enabled) =>
                  save(
                    () => setCardEnabled(card.id, enabled),
                    enabled ? t("enabledToast") : t("disabledToast"),
                  )
                }
              />
            </div>

            {/* Chip URL Box */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <span className="text-xs font-semibold text-muted-foreground">{t("cardUrl")}</span>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 truncate rounded-md bg-black/40 px-2 py-1 text-xs text-foreground/90">
                  {cardUrl}
                </code>
                <Button variant="outline" size="sm" onClick={copyUrl} className="h-7 gap-1 px-2.5 text-xs">
                  <CopyIcon className="size-3" />
                  <span>{t("copy").split(" ")[0]}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="size-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <a href={cardUrl} target="_blank" rel="noopener noreferrer" title="Open card link">
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: QR Code View */
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="rounded-2xl border border-white/15 bg-white p-3 shadow-xl">
              <QrCode value={qrUrl} size={150} label={t("qrLabel", { code: card.code })} />
            </div>
            <div className="flex w-full flex-col items-center gap-2">
              <QrDownloadButtons
                value={qrUrl}
                filename={`card-${card.code}`}
                labels={{ png: "PNG", svg: "SVG", failed: t("qrFailed") }}
              />
              <Button variant="outline" size="sm" onClick={copyUrl} className="w-full gap-1.5 text-xs">
                <CopyIcon className="size-3.5" />
                <span>{t("copy")}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DESKTOP / LAPTOP / TABLET LANDSCAPE VIEW (100% UNTOUCHED)
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden sm:block">
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
      </div>
    </>
  );
}
