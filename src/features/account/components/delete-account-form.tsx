"use client";

import { Loader2Icon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isOpen) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{t("title")}</span>
          <span className="text-xs text-muted-foreground">{t("description")}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon className="mr-1.5 size-3.5" />
          <span>{t("title")}</span>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-4"
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive-foreground">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <p className="leading-relaxed">{t("warning")}</p>
      </div>
      <Field>
        <FieldLabel htmlFor="confirm-email" className="text-xs font-semibold">
          {t("confirmLabel", { email })}
        </FieldLabel>
        <Input
          id="confirm-email"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error === "mismatch"}
          aria-describedby="confirm-email-hint"
          className="bg-white text-xs"
        />
        <FieldDescription id="confirm-email-hint" className="text-[11px]">
          {t("confirmHint")}
        </FieldDescription>
      </Field>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" variant="destructive" size="sm" disabled={!matches || pending}>
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          {t("submit")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            setIsOpen(false);
            setTyped("");
            setError(null);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
