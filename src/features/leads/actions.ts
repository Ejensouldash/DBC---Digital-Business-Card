"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { slugSchema } from "@/features/profiles/schemas";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { isRaisedException } from "@/lib/db/errors";
import { leads, profiles } from "@/lib/db/schema";

import { listOwnerLeads } from "./queries";
import { leadFormSchema, type LeadFormInput } from "./schemas";

export type LeadError = "invalid" | "unavailable" | "rate_limited" | "unexpected";
export type OwnerLeadError = "unauthorized" | "invalid" | "not_found";

// Public: a visitor shares their contact with a profile owner. No login.
export async function submitLead(
  slug: string,
  input: LeadFormInput,
): Promise<ActionResult<undefined, LeadError>> {
  const parsedSlug = slugSchema.safeParse(slug);
  const parsed = leadFormSchema.safeParse(input);
  if (!parsedSlug.success || !parsed.success) return fail("invalid");
  const { fax, ...lead } = parsed.data;
  // Pretend it worked so bots don't learn to skip the honeypot.
  if (fax) return ok();

  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.slug, parsedSlug.data),
      eq(profiles.isPublished, true),
      eq(profiles.leadFormEnabled, true),
    ),
    columns: { id: true },
  });
  if (!profile) return fail("unavailable");

  try {
    await db.insert(leads).values({ ...lead, consent: true, profileId: profile.id });
  } catch (error) {
    if (isRaisedException(error, "lead_rate_limited")) return fail("rate_limited");
    console.error("[leads] insert failed", error);
    return fail("unexpected");
  }
  return ok();
}

export async function exportLeadsCsv(): Promise<
  ActionResult<{ csv: string; filename: string }, OwnerLeadError>
> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");

  const rows = await listOwnerLeads(user.id);
  const csv = toCsv(
    ["name", "phone", "email", "company", "message", "profile", "received_at"],
    rows.map((lead) => [
      lead.name,
      lead.phone,
      lead.email,
      lead.company,
      lead.message,
      lead.profileSlug,
      lead.createdAt,
    ]),
  );
  return ok({ csv, filename: `leads-${new Date().toISOString().slice(0, 10)}.csv` });
}

// Owners can erase a lead, e.g. when the visitor asks (PDPA).
export async function deleteLead(leadId: string): Promise<ActionResult<undefined, OwnerLeadError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!z.uuid().safeParse(leadId).success) return fail("invalid");

  const ownProfiles = db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.ownerId, user.id));
  const deleted = await db
    .delete(leads)
    .where(and(eq(leads.id, leadId), inArray(leads.profileId, ownProfiles)))
    .returning({ id: leads.id });
  return deleted.length > 0 ? ok() : fail("not_found");
}
