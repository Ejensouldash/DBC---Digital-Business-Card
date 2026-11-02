"use client";

import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import { FormTextField } from "@/components/shared/form-text-field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

import type { ProfileFormInput, ProfileFormValues } from "../schemas";

import { ThemeFields } from "./theme-fields";

type FieldsProps = {
  control: Control<ProfileFormInput, unknown, ProfileFormValues>;
  slugHint: string;
};

function ToggleField({
  control,
  name,
  label,
  description,
}: {
  control: FieldsProps["control"];
  name: "isPublished" | "allowIndexing" | "leadFormEnabled";
  label: string;
  description: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <FieldDescription>{description}</FieldDescription>
          </FieldContent>
          <Switch id={name} checked={field.value} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  );
}

export function ProfileFormFields({ control, slugHint }: FieldsProps) {
  const t = useTranslations("ProfileEditor");

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>{t("sections.about")}</FieldLegend>
        <FieldGroup>
          <FormTextField
            control={control}
            name="displayName"
            label={t("fields.displayName")}
            autoComplete="name"
          />
          <FormTextField
            control={control}
            name="slug"
            label={t("fields.slug")}
            description={slugHint}
            autoCapitalize="none"
            spellCheck={false}
          />
          <FormTextField control={control} name="jobTitle" label={t("fields.jobTitle")} />
          <FormTextField control={control} name="company" label={t("fields.company")} />
          <FormTextField control={control} name="bio" label={t("fields.bio")} multiline />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.contact")}</FieldLegend>
        <FieldGroup>
          <FormTextField
            control={control}
            name="phone"
            label={t("fields.phone")}
            type="tel"
            autoComplete="tel"
          />
          <FormTextField
            control={control}
            name="whatsapp"
            label={t("fields.whatsapp")}
            description={t("hints.whatsapp")}
            type="tel"
          />
          <FormTextField
            control={control}
            name="email"
            label={t("fields.email")}
            type="email"
            autoComplete="email"
          />
          <FormTextField
            control={control}
            name="website"
            label={t("fields.website")}
            type="url"
            placeholder="https://"
          />
          <FormTextField control={control} name="address" label={t("fields.address")} multiline />
          <FormTextField
            control={control}
            name="mapsUrl"
            label={t("fields.mapsUrl")}
            description={t("hints.mapsUrl")}
            type="url"
            placeholder="https://maps.app.goo.gl/…"
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("sections.visibility")}</FieldLegend>
        <FieldGroup>
          <ToggleField
            control={control}
            name="isPublished"
            label={t("fields.isPublished")}
            description={t("hints.isPublished")}
          />
          <ToggleField
            control={control}
            name="allowIndexing"
            label={t("fields.allowIndexing")}
            description={t("hints.allowIndexing")}
          />
          <ToggleField
            control={control}
            name="leadFormEnabled"
            label={t("fields.leadFormEnabled")}
            description={t("hints.leadFormEnabled")}
          />
        </FieldGroup>
      </FieldSet>

      <ThemeFields control={control} />
    </FieldGroup>
  );
}
