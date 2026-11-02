import { getFormatter, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
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
import { listOwnerLeads } from "@/features/leads/queries";
import { requireUser } from "@/lib/auth/session";
import { telHref } from "@/lib/phone";

export default async function LeadsPage() {
  const [user, t, format] = await Promise.all([
    requireUser("/dashboard/leads"),
    getTranslations("Leads"),
    getFormatter(),
  ]);
  const leads = await listOwnerLeads(user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={leads.length > 0 ? <LeadsExportButton /> : null}
      />
      {leads.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.contact")}</TableHead>
              <TableHead>{t("columns.message")}</TableHead>
              <TableHead>{t("columns.profile")}</TableHead>
              <TableHead>{t("columns.received")}</TableHead>
              <TableHead className="sr-only">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const tel = lead.phone ? telHref(lead.phone) : null;
              return (
                <TableRow key={lead.id} className="align-top">
                  <TableCell>
                    <div className="font-medium">{lead.name}</div>
                    {lead.company ? (
                      <div className="text-muted-foreground">{lead.company}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
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
                  <TableCell className="max-w-64 whitespace-pre-line">
                    {lead.message ?? "—"}
                  </TableCell>
                  <TableCell>/p/{lead.profileSlug}</TableCell>
                  <TableCell>
                    {format.dateTime(lead.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteLeadButton leadId={lead.id} name={lead.name} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
