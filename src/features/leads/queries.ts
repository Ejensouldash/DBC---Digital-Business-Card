import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, profiles } from "@/lib/db/schema";

// Leads from all of the owner's profiles, newest first.
export async function listOwnerLeads(ownerId: string) {
  return db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      email: leads.email,
      company: leads.company,
      message: leads.message,
      jobTitle: leads.jobTitle,
      website: leads.website,
      address: leads.address,
      cardImagePath: leads.cardImagePath,
      cardDesign: leads.cardDesign,
      source: leads.source,
      createdAt: leads.createdAt,
      profileSlug: profiles.slug,
    })
    .from(leads)
    .innerJoin(profiles, eq(profiles.id, leads.profileId))
    .where(eq(profiles.ownerId, ownerId))
    .orderBy(desc(leads.createdAt));
}

export type OwnerLead = Awaited<ReturnType<typeof listOwnerLeads>>[number];
