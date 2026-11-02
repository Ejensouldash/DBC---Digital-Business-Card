"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormFieldError } from "@/components/shared/form-field-error";
import { FormTextField } from "@/components/shared/form-text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";

import { submitLead, type LeadError } from "../actions";
import { leadFormSchema, type LeadFormInput, type LeadFormValues } from "../schemas";

const EMPTY_LEAD: LeadFormInput = {
  name: "",
  phone: "",
  email: "",
  company: "",
  message: "",
  consent: false,
  fax: "",
};

type LeadFormDialogProps = { slug: string; ownerName: string };

// "Exchange contacts": a visitor leaves their details for the profile owner.
export function LeadFormDialog({ slug, ownerName }: LeadFormDialogProps) {
  const t = useTranslations("LeadForm");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<LeadError | null>(null);
  const form = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: EMPTY_LEAD,
  });

  // Send the raw input: the server validates it again with the same schema.
  const onSubmit = form.handleSubmit(async () => {
    setError(null);
    const result = await submitLead(slug, form.getValues());
    if (!result.ok) return setError(result.error);
    setSent(true);
    form.reset(EMPTY_LEAD);
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSent(false);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition outline-none hover:bg-zinc-50 focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.97]"
        >
          <SendIcon className="size-4" aria-hidden />
          {t("open")}
        </button>
      </DialogTrigger>
      <DialogContent className="light max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { name: ownerName })}</DialogTitle>
          <DialogDescription>{t("description", { name: ownerName })}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2Icon className="size-10 text-primary" aria-hidden />
            <p>{t("sent", { name: ownerName })}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup className="gap-4">
              <FormTextField
                control={form.control}
                name="name"
                label={t("name")}
                autoComplete="name"
              />
              <FormTextField
                control={form.control}
                name="phone"
                label={t("phone")}
                description={t("contactHint")}
                type="tel"
                autoComplete="tel"
              />
              <FormTextField
                control={form.control}
                name="email"
                label={t("email")}
                type="email"
                autoComplete="email"
              />
              <FormTextField
                control={form.control}
                name="company"
                label={t("company")}
                autoComplete="organization"
              />
              <FormTextField control={form.control} name="message" label={t("message")} multiline />
              {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
              <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  {t("honeypot")}
                  <input {...form.register("fax")} tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <Controller
                control={form.control}
                name="consent"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name={field.name}
                        ref={field.ref}
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                      />
                      <span>
                        {t.rich("consent", {
                          name: ownerName,
                          link: (chunks) => (
                            <Link href="/privacy" target="_blank" className="underline">
                              {chunks}
                            </Link>
                          ),
                        })}
                      </span>
                    </label>
                    <FormFieldError error={fieldState.error} />
                  </Field>
                )}
              />
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {t(`errors.${error}`)}
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : null}
                {t("submit")}
              </Button>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
