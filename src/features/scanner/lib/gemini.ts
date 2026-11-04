import "server-only";

import { env } from "@/lib/env";

export type ExtractedCardDesign = {
  dominantColor: string;
  accentColor?: string;
  textColor: string;
  styleTheme?: "dark" | "light" | "colorful";
};

export type ExtractedBusinessCard = {
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  design?: ExtractedCardDesign | null;
};

export type ScanResult =
  | { ok: true; data: ExtractedBusinessCard; modelUsed: string }
  | { ok: false; error: string };

function cleanBase64(input: string): { data: string; mimeType: string } {
  if (input.startsWith("data:")) {
    const [meta, data] = input.split(",");
    const match = meta.match(/data:(.*?);base64/);
    const mimeType = match ? match[1] : "image/jpeg";
    return { data, mimeType };
  }
  return { data: input, mimeType: "image/jpeg" };
}

export async function extractBusinessCardWithGemini(
  imageSource: string,
): Promise<ScanResult> {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: "gemini_key_missing",
    };
  }

  const { data: base64Data, mimeType } = cleanBase64(imageSource);

  // Model fallback chain:
  // Starts with user configured model or gemini-2.5-flash, falls back gracefully.
  const configuredModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL;
  const fallbackModels = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
  ];
  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    ...fallbackModels,
  ].filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index);

  const prompt = `Analyze this physical business card image and extract contact details and design properties accurately.
Return a clean JSON object with:
- name: Full name of the person (required)
- jobTitle: Job title, role or profession
- company: Company or business name
- phone: Direct or mobile telephone number
- email: Email address
- website: Website URL (ensure it starts with https:// if missing)
- address: Office/physical address if present
- notes: Any tagline, brief services or additional text
- design: {
    dominantColor: Hex color of the main card background (e.g. "#1e1b4b" or "#ffffff"),
    accentColor: Hex color of secondary logo or highlight (e.g. "#6366f1"),
    textColor: Contrasting hex color for readable text (e.g. "#ffffff" or "#111827"),
    styleTheme: "dark" | "light" | "colorful"
  }`;

  let lastError = "Unable to process business card.";

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Gemini OCR] Model ${model} failed with ${response.status}: ${errorText}`);
        lastError = `Model ${model} error: ${response.status}`;
        continue; // Try next fallback model
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = `Model ${model} returned empty content`;
        continue;
      }

      // Parse structured JSON response (strip markdown code blocks if present)
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      const parsed = JSON.parse(cleanJson) as ExtractedBusinessCard;

      const rawName = typeof parsed.name === "string" ? parsed.name.trim() : "";
      const rawCompany = typeof parsed.company === "string" ? parsed.company.trim() : "";

      if (!rawName && !rawCompany) {
        lastError = "Could not find a valid name or company on the business card.";
        continue;
      }

      parsed.name = rawName || rawCompany;

      // Normalize design fallback if AI didn't provide hex
      const design: ExtractedCardDesign = {
        dominantColor: parsed.design?.dominantColor || "#0f172a",
        accentColor: parsed.design?.accentColor || "#6366f1",
        textColor: parsed.design?.textColor || "#ffffff",
        styleTheme: parsed.design?.styleTheme || "dark",
      };

      return {
        ok: true,
        data: {
          ...parsed,
          design,
        },
        modelUsed: model,
      };
    } catch (err) {
      console.warn(`[Gemini OCR] Error with model ${model}:`, err);
      lastError = err instanceof Error ? err.message : "Unknown AI error";
    }
  }

  return {
    ok: false,
    error: lastError,
  };
}
