"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormTextField } from "@/components/shared/form-text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LINK_TYPES } from "@/lib/link-types";

import { linkFormSchema, type LinkFormInput, type LinkFormValues } from "../schemas";

type LinkDialogProps = {
  title: string;
  trigger: ReactNode;
  defaults?: LinkFormInput;
  // Resolves to true when saved, so the dialog can close.
  onSubmit: (input: LinkFormInput) => Promise<boolean>;
};

const EMPTY: LinkFormInput = { type: "instagram", label: "", url: "" };

export function LinkDialog({ title, trigger, defaults = EMPTY, onSubmit }: LinkDialogProps) {
  const t = useTranslations("Links");
  const tTypes = useTranslations("Profile.linkTypes");
  const [open, setOpen] = useState(false);
  const form = useForm<LinkFormInput, unknown, LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: defaults,
  });

  // Send the raw input: the server validates it again with the same schema.
  const submit = form.handleSubmit(async () => {
    if (await onSubmit(form.getValues())) {
      setOpen(false);
      form.reset(defaults);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(defaults);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="link-type">{t("type")}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="link-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {tTypes(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <FormTextField
              control={form.control}
              name="url"
              label={t("url")}
              placeholder="instagram.com/yourname"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
            />
            <FormTextField
              control={form.control}
              name="label"
              label={t("label")}
              description={t("labelHint")}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : null}
                {t("save")}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
