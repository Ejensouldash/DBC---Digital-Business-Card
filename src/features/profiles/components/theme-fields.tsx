"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { THEME_ACCENTS, THEME_LAYOUTS, type ThemeAccent } from "@/lib/profile-theme";
import { cn } from "@/lib/utils";

import type { ProfileFormInput, ProfileFormValues } from "../schemas";

type ThemeFieldsProps = {
  control: Control<ProfileFormInput, unknown, ProfileFormValues>;
  embedded?: boolean;
};

const ACCENT_NAMES = Object.keys(THEME_ACCENTS) as ThemeAccent[];

// Native radio inputs (visually hidden) keep arrow-key navigation and screen reader support.
const OPTION_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

export function ThemeFields({ control, embedded = false }: ThemeFieldsProps) {
  const t = useTranslations("ProfileEditor.theme");

  const content = (
    <FieldGroup>
      <Controller
        control={control}
        name="theme.accent"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("accent")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACCENT_NAMES.map((accent) => (
                <label key={accent} className={OPTION_CLASS}>
                  <input
                    type="radio"
                    name={field.name}
                    value={accent}
                    checked={field.value === accent}
                    onChange={() => field.onChange(accent)}
                    className="sr-only"
                  />
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: THEME_ACCENTS[accent], color: "#ffffff" }}
                    aria-hidden
                  >
                    {field.value === accent ? <CheckIcon className="size-3" /> : null}
                  </span>
                  {t(`accents.${accent}`)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />
      <Controller
        control={control}
        name="theme.layout"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("layout")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {THEME_LAYOUTS.map((layout) => (
                <label key={layout} className={cn(OPTION_CLASS, "items-start")}>
                  <input
                    type="radio"
                    name={field.name}
                    value={layout}
                    checked={field.value === layout}
                    onChange={() => field.onChange(layout)}
                    className="sr-only"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium">{t(`layouts.${layout}`)}</span>
                    <span className="text-muted-foreground">
                      {t(`layouts.${layout}Description`)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />
    </FieldGroup>
  );

  if (embedded) {
    return content;
  }

  return (
    <FieldSet>
      <FieldLegend>{t("title")}</FieldLegend>
      {content}
    </FieldSet>
  );
}
