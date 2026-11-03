"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leads, profiles } from "@/lib/db/schema";
import { isStorageConfigured, putPublicObject } from "@/lib/storage";

import { extractBusinessCardWithGemini, type ExtractedBusinessCard } from "./lib/gemini";
import { saveScannedLeadSchema, type SaveScannedLeadInput } from "./schemas";

export type ScanCardError =
  | "unauthorized"
  | "no_image_provided"
  | "file_too_large"
  | "gemini_key_missing"
  | "processing_failed"
  | "invalid_format";

export type SaveScannedLeadError =
  | "unauthorized"
  | "invalid_input"
  | "profile_not_found"
  | "database_error";

export async function scanCardImage(formData: FormData): Promise<
  ActionResult<
    {
      card: ExtractedBusinessCard;
      imagePreview: string;
      modelUsed: string;
    },
    ScanCardError
  >
> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");

  const file = formData.get("image");
  if (!file || !(file instanceof File)) {
    return fail("no_image_provided");
  }

  // Max 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return fail("file_too_large");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const result = await extractBusinessCardWithGemini(dataUrl);

    if (!result.ok) {
      if (result.error === "gemini_key_missing") {
        return fail("gemini_key_missing");
      }
      return fail("processing_failed");
    }

    return ok({
      card: result.data,
      imagePreview: dataUrl,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error("[Card Scanner] Failed to scan card image:", error);
    return fail("processing_failed");
  }
}

export async function saveScannedLead(
  input: SaveScannedLeadInput,
): Promise<ActionResult<{ leadId: string }, SaveScannedLeadError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");

  const parsed = saveScannedLeadSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid_input");
  }

  const data = parsed.data;

  // Verify that the target profile belongs to this owner
  const targetProfile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, data.profileId), eq(profiles.ownerId, user.id)),
    columns: { id: true },
  });

  if (!targetProfile) {
    return fail("profile_not_found");
  }

  const leadId = crypto.randomUUID();
  let cardImagePath: string | null = null;

  // If card photo base64 is provided and R2 storage is configured, upload it
  if (data.cardImageBase64 && isStorageConfigured()) {
    try {
      const match = data.cardImageBase64.match(/^data:(.*?);base64,(.*)$/);
      const mime = match ? match[1] : "image/jpeg";
      const rawBase64 = match ? match[2] : data.cardImageBase64;
      const buffer = Buffer.from(rawBase64, "base64");
      const storageKey = `${user.id}/cards/${leadId}.jpg`;

      await putPublicObject(storageKey, buffer, mime);
      cardImagePath = storageKey;
    } catch (storageErr) {
      console.warn("[Card Scanner] Failed to upload card image to storage:", storageErr);
      // Non-fatal: still save the lead record even if cloud storage upload fails
    }
  }

  try {
    const [inserted] = await db
      .insert(leads)
      .values({
        id: leadId,
        profileId: targetProfile.id,
        name: data.name,
        company: data.company || null,
        jobTitle: data.jobTitle || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        address: data.address || null,
        message: data.notes || null,
        cardImagePath,
        cardDesign: data.cardDesign || null,
        source: "scanned_card",
        consent: true,
      })
      .returning({ id: leads.id });

    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard");

    return ok({ leadId: inserted.id });
  } catch (dbErr) {
    console.error("[Card Scanner] Failed to insert scanned lead:", dbErr);
    return fail("database_error");
  }
}
