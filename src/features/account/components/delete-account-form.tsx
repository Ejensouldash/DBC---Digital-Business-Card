"use client";

import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { deleteAccount, type AccountError } from "../actions";

export function DeleteAccountForm({ email }: { email: string }) {
  const t = useTranslations("Settings.delete");
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<AccountError | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(typed);
      if (!result.ok) return setError(result.error);
      toast.success(t("done"));
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="flex gap-2 text-sm">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        {t("warning")}
      </p>
      <Field>
        <FieldLabel htmlFor="confirm-email">{t("confirmLabel", { email })}</FieldLabel>
        <Input
          id="confirm-email"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error === "mismatch"}
          aria-describedby="confirm-email-hint"
        />
        <FieldDescription id="confirm-email-hint">{t("confirmHint")}</FieldDescription>
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <div>
        <Button type="submit" variant="destructive" disabled={!matches || pending}>
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
