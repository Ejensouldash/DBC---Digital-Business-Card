"use client";

import { useTranslations } from "next-intl";

import type { claimCard } from "../actions";

type ActivationError = Extract<Awaited<ReturnType<typeof claimCard>>, { ok: false }>["error"];

export function useActivationError() {
  const t = useTranslations("Activate.errors");
  return (error: ActivationError) => t(error);
}
