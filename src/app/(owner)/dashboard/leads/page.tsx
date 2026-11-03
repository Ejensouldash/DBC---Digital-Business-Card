import {
  CreditCardIcon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareQuoteIcon,
  PhoneIcon,
  SparklesIcon,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteLeadButton } from "@/features/leads/components/delete-lead-button";
import { LeadsExportButton } from "@/features/leads/components/leads-export-button";
import { LeadVCardButton } from "@/features/leads/components/lead-vcard-button";
import { ViewScannedCardDialog } from "@/features/leads/components/view-scanned-card-dialog";
import { listOwnerLeads } from "@/features/leads/queries";
import { listOwnerProfiles } from "@/features/profiles/queries";
import { CardScannerDialog } from "@/features/scanner/components/card-scanner-dialog";
import { requireUser } from "@/lib/auth/session";
import { telHref, whatsAppHref } from "@/lib/phone";
import { publicObjectUrl } from "@/lib/storage";

export default async function LeadsPage() {
  const [user, t, format] = await Promise.all([
    requireUser("/dashboard/leads"),
    getTranslations("Leads"),
    getFormatter(),
  ]);
  const [leads, profiles] = await Promise.all([
    listOwnerLeads(user.id),
    listOwnerProfiles(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            <CardScannerDialog profiles={profiles} />
            {leads.length > 0 ? <LeadsExportButton /> : null}
          </div>
        }
      />
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <SparklesIcon className="size-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-semibold text-foreground">No leads collected yet</h3>
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
          <CardScannerDialog
            profiles={profiles}
            trigger={
              <Button className="gap-2 mt-2">
                <CreditCardIcon className="size-4" />
                <span>Scan Your First Card</span>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              1. MOBILE VIEW (< sm) - Sleek Contact Cards with One-Tap Actions
          ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3.5 sm:hidden">
            {leads.map((lead) => {
              const tel = lead.phone ? telHref(lead.phone) : null;
              const wa = lead.phone ? whatsAppHref(lead.phone) : null;
              const initial = lead.name.trim().charAt(0).toUpperCase() || "?";
              const isScanned = lead.source === "scanned_card";
              const subtitle = [lead.jobTitle, lead.company].filter(Boolean).join(" · ");
              const imageUrl = lead.cardImagePath ? publicObjectUrl(lead.cardImagePath) : null;

              return (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 shadow-lg backdrop-blur-md"
                >
                  {/* Top Header: Avatar + Name/Company + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Lead Avatar Initial */}
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 via-primary/20 to-indigo-600/30 text-base font-bold text-primary ring-1 ring-primary/30 shadow-inner">
                        {initial}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate text-base font-semibold text-foreground">
                            {lead.name}
                          </span>
                          {isScanned ? (
                            <Badge
                              variant="outline"
                              className="border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] px-1.5 py-0 h-4 gap-1"
                            >
                              <SparklesIcon className="size-2.5" />
                              <span>Scanned</span>
                            </Badge>
                          ) : null}
                        </div>
                        {subtitle ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <DeleteLeadButton leadId={lead.id} name={lead.name} />
                  </div>

                  {/* Message / Tagline Bubble (if exists) */}
                  {lead.message ? (
                    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-muted-foreground/80">
                        <MessageSquareQuoteIcon className="size-3.5" />
                        <span>{t("columns.message")}</span>
                      </div>
                      <p className="whitespace-pre-line pl-1 leading-relaxed text-foreground/90">
                        {lead.message}
                      </p>
                    </div>
                  ) : null}

                  {/* Quick Contact Action Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {lead.phone && tel ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 gap-1.5 rounded-full border-emerald-500/30 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <a href={tel}>
                          <PhoneIcon className="size-3" />
                          <span>Call</span>
                        </a>
                      </Button>
                    ) : null}

                    {lead.phone && wa ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 gap-1.5 rounded-full border-green-500/30 px-3 text-xs font-medium text-green-400 hover:bg-green-500/10"
                      >
                        <a href={wa} target="_blank" rel="noopener noreferrer">
                          <MessageCircleIcon className="size-3" />
                          <span>WhatsApp</span>
                        </a>
                      </Button>
                    ) : null}

                    {lead.email ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 gap-1.5 rounded-full border-blue-500/30 px-3 text-xs font-medium text-blue-400 hover:bg-blue-500/10"
                      >
                        <a href={`mailto:${lead.email}`}>
                          <MailIcon className="size-3" />
                          <span>Email</span>
                        </a>
                      </Button>
                    ) : null}

                    {/* View Card Dialog Button if Scanned Card */}
                    {isScanned || lead.cardDesign || imageUrl ? (
                      <ViewScannedCardDialog
                        lead={lead}
                        cardImageUrl={imageUrl}
                      />
                    ) : null}

                    {/* Download vCard Pill */}
                    <LeadVCardButton
                      contact={{
                        name: lead.name,
                        company: lead.company,
                        jobTitle: lead.jobTitle,
                        phone: lead.phone,
                        email: lead.email,
                        website: lead.website,
                        address: lead.address,
                        notes: lead.message,
                      }}
                      className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium"
                    />
                  </div>

                  {/* Footer: Source Profile & Formatted Date */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GlobeIcon className="size-3" />
                      <span>/p/{lead.profileSlug}</span>
                    </span>
                    <span>
                      {format.dateTime(lead.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. DESKTOP / LAPTOP / TABLET LANDSCAPE VIEW
          ───────────────────────────────────────────────────────────── */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.name")}</TableHead>
                  <TableHead>{t("columns.contact")}</TableHead>
                  <TableHead>{t("columns.message")}</TableHead>
                  <TableHead>{t("columns.profile")}</TableHead>
                  <TableHead>{t("columns.received")}</TableHead>
                  <TableHead className="text-right">{t("columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const tel = lead.phone ? telHref(lead.phone) : null;
                  const isScanned = lead.source === "scanned_card";
                  const subtitle = [lead.jobTitle, lead.company].filter(Boolean).join(" · ");
                  const imageUrl = lead.cardImagePath ? publicObjectUrl(lead.cardImagePath) : null;

                  return (
                    <TableRow key={lead.id} className="align-top">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lead.name}</span>
                          {isScanned ? (
                            <Badge
                              variant="outline"
                              className="border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] px-1.5 py-0 gap-1"
                            >
                              <SparklesIcon className="size-2.5" />
                              <span>Scanned</span>
                            </Badge>
                          ) : null}
                        </div>
                        {subtitle ? (
                          <div className="text-xs text-muted-foreground">{subtitle}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {lead.phone && tel ? (
                            <a href={tel} className="hover:underline">
                              {lead.phone}
                            </a>
                          ) : (
                            lead.phone
                          )}
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="hover:underline">
                              {lead.email}
                            </a>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-pre-line text-sm">
                        {lead.message ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">/p/{lead.profileSlug}</TableCell>
                      <TableCell className="text-sm">
                        {format.dateTime(lead.createdAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isScanned || lead.cardDesign || imageUrl ? (
                            <ViewScannedCardDialog
                              lead={lead}
                              cardImageUrl={imageUrl}
                            />
                          ) : null}
                          <LeadVCardButton
                            contact={{
                              name: lead.name,
                              company: lead.company,
                              jobTitle: lead.jobTitle,
                              phone: lead.phone,
                              email: lead.email,
                              website: lead.website,
                              address: lead.address,
                              notes: lead.message,
                            }}
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg border-white/10 bg-white/[0.03] px-2.5 text-xs font-medium text-foreground hover:bg-white/10 hover:border-white/20 transition-colors shadow-xs"
                            showText
                          />
                          <div className="h-4 w-px bg-white/10 mx-0.5" aria-hidden />
                          <DeleteLeadButton
                            leadId={lead.id}
                            name={lead.name}
                            variant="outline"
                            className="size-8 rounded-lg border-white/10 bg-white/[0.02] text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors shadow-xs"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
