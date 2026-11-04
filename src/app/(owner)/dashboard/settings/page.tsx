import {
  CreditCardIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountForm } from "@/features/account/components/delete-account-form";
import { listOwnerCards } from "@/features/cards/queries";
import { listOwnerLeads } from "@/features/leads/queries";
import { listOwnerProfiles } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const [user, t] = await Promise.all([
    requireUser("/dashboard/settings"),
    getTranslations("Settings"),
  ]);

  const [profiles, cards, leads] = await Promise.all([
    listOwnerProfiles(user.id),
    listOwnerCards(user.id),
    listOwnerLeads(user.id),
  ]);

  const totalTaps = cards.reduce((sum, c) => sum + c.taps, 0);
  const userInitial = user.name
    ? user.name.trim().charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      {/* 1. HERO ACCOUNT CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* User Profile Info */}
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-2xl font-bold text-white shadow-sm ring-2 ring-teal-200/60">
              {userInitial}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold tracking-tight text-foreground">
                  {user.name || "Card Owner"}
                </h2>
                <Badge
                  variant="outline"
                  className="gap-1 border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800"
                >
                  {user.isAdmin ? (
                    <>
                      <ShieldCheckIcon className="size-3 text-teal-600" />
                      <span>{t("overview.admin")}</span>
                    </>
                  ) : (
                    <>
                      <UserCheckIcon className="size-3 text-teal-600" />
                      <span>{t("overview.owner")}</span>
                    </>
                  )}
                </Badge>
              </div>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>

          {/* Quick Metrics Tiles */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:gap-3">
            <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <SparklesIcon className="size-3 text-teal-600" />
                <span>{t("overview.profiles")}</span>
              </div>
              <span className="mt-0.5 text-lg font-bold text-foreground">{profiles.length}</span>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <CreditCardIcon className="size-3 text-teal-600" />
                <span>{t("overview.cards")}</span>
              </div>
              <span className="mt-0.5 text-lg font-bold text-foreground">{cards.length}</span>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <UsersIcon className="size-3 text-emerald-600" />
                <span>{t("overview.leads")}</span>
              </div>
              <span className="mt-0.5 text-lg font-bold text-foreground">{leads.length}</span>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <ZapIcon className="size-3 text-amber-500" />
                <span>{t("overview.totalTaps")}</span>
              </div>
              <span className="mt-0.5 text-lg font-bold text-foreground">{totalTaps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN SETTINGS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Authentication & Security */}
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-500/20">
                <KeyRoundIcon className="size-4" />
              </div>
              <span>{t("security.title")}</span>
            </CardTitle>
            <CardDescription>{t("security.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("account.email")}
              </span>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <code className="truncate text-xs font-medium text-foreground sm:text-sm">
                  {user.email}
                </code>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                >
                  Verified
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("security.methods")}
              </span>
              <span className="text-xs font-medium text-foreground/90">
                {t("security.methodsHint")}
              </span>
            </div>

            <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
              {t.rich("account.description", {
                link: (chunks) => (
                  <Link
                    href="/privacy#contact"
                    className="text-primary underline hover:text-primary/80"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </CardContent>
        </Card>

        {/* Card: Privacy & Support */}
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-500/20">
                <HelpCircleIcon className="size-4" />
              </div>
              <span>{t("support.title")}</span>
            </CardTitle>
            <CardDescription>{t("support.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {/* Privacy Policy Link item */}
            <Link
              href="/privacy"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition-colors hover:bg-teal-50/50 hover:border-teal-200"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  {t("support.privacyNotice")}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t("support.privacyNoticeDesc")}
                </span>
              </div>
              <ExternalLinkIcon className="size-4 text-muted-foreground" />
            </Link>

            {/* Support link item */}
            <Link
              href="/privacy#contact"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition-colors hover:bg-teal-50/50 hover:border-teal-200"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  {t("support.contactHelp")}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t("support.contactHelpDesc")}
                </span>
              </div>
              <ExternalLinkIcon className="size-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 3. DANGER ZONE */}
      <Card className="rounded-3xl border-rose-200 bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlertIcon className="size-4" />
            </div>
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>{t("delete.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
