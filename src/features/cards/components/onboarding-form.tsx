"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormFieldError } from "@/components/shared/form-field-error";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { suggestSlug } from "@/features/profiles/lib/slug";
import {
  onboardingSchema,
  type OnboardingInput,
  type OnboardingValues,
} from "@/features/profiles/schemas";
import { useRouter } from "@/i18n/navigation";

import { createProfileAndClaimCard } from "../actions";

import { useActivationError } from "./use-activation-error";

type OnboardingFormProps = { code: string; defaultName: string; profileBaseUrl: string };

export function OnboardingForm({ code, defaultName, profileBaseUrl }: OnboardingFormProps) {
  const t = useTranslations("Activate");
  const errorMessage = useActivationError();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<OnboardingInput, unknown, OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { displayName: defaultName, slug: suggestSlug(defaultName), phone: "" },
  });

  // Send the raw input: the server validates it again with the same schema.
  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const result = await createProfileAndClaimCard(code, form.getValues());
      if (!result.ok) {
        if (result.error === "slug_taken") {
          form.setError("slug", { message: "slugTaken" });
        }
        toast.error(errorMessage(result.error));
        return;
      }
      router.replace({ pathname: "/dashboard", query: { claimed: "1" } });
    }),
  );

  const slug = useWatch({ control: form.control, name: "slug" });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="displayName">{t("displayName")}</FieldLabel>
              <Input
                id="displayName"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
                {...field}
              />
              <FormFieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="slug">{t("slug")}</FieldLabel>
              <Input
                id="slug"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
                {...field}
              />
              <FieldDescription>
                {t("slugHint", { url: `${profileBaseUrl}${slug || "…"}` })}
              </FieldDescription>
              <FormFieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phone">{t("phone")}</FieldLabel>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="012-345 6789"
                aria-invalid={fieldState.invalid}
                {...field}
              />
              <FormFieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          {t("createAndClaim")}
        </Button>
      </FieldGroup>
    </form>
  );
}
