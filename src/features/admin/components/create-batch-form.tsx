"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormTextField } from "@/components/shared/form-text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { downloadTextFile } from "@/lib/download";

import { createCardBatch } from "../actions";
import {
  createBatchSchema,
  MAX_BATCH_QUANTITY,
  type CreateBatchInput,
  type CreateBatchValues,
} from "../schemas";

export function CreateBatchForm() {
  const t = useTranslations("Admin.batches");
  const tErrors = useTranslations("Admin.errors");
  const router = useRouter();
  const form = useForm<CreateBatchInput, unknown, CreateBatchValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: { name: "", quantity: 100, notes: "" },
  });

  // Send the raw input: the server validates it again with the same schema.
  const onSubmit = form.handleSubmit(async () => {
    const result = await createCardBatch(form.getValues());
    if (!result.ok) {
      toast.error(tErrors(result.error));
      return;
    }
    downloadTextFile(result.data.csv, result.data.filename);
    toast.success(t("created"));
    form.reset();
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="sm:grid sm:grid-cols-[2fr_1fr] sm:gap-4">
        <FormTextField
          control={form.control}
          name="name"
          label={t("name")}
          placeholder={t("namePlaceholder")}
        />
        <FormTextField
          control={form.control}
          name="quantity"
          label={t("quantity")}
          description={t("quantityHint", { max: MAX_BATCH_QUANTITY })}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_BATCH_QUANTITY}
        />
        <div className="sm:col-span-2">
          <FormTextField control={form.control} name="notes" label={t("notes")} multiline />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : null}
            {t("create")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
