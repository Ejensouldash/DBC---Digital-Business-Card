"use client";

import { useTranslations, type Messages } from "next-intl";
import type { FieldError as HookFormError } from "react-hook-form";

import { FieldError } from "@/components/ui/field";

type ValidationKey = keyof Messages["Validation"];

// Zod messages in our schemas are keys under `Validation`; anything else shows `invalid`.
export function FormFieldError({ error }: { error?: HookFormError }) {
  const t = useTranslations("Validation");
  if (!error) return null;
  const key = (error.message ?? "invalid") as ValidationKey;
  return <FieldError>{t.has(key) ? t(key) : t("invalid")}</FieldError>;
}
