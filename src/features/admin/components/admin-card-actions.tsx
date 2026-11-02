"use client";

import { EllipsisIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/shared/use-confirm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";

import { reassignCard, resetCard, setCardDisabled, type AdminError } from "../actions";
import type { AdminCardRow } from "../queries";

export function AdminCardActions({ card }: { card: Pick<AdminCardRow, "id" | "code" | "status"> }) {
  const t = useTranslations("Admin.cards");
  const tErrors = useTranslations("Admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reassigning, setReassigning] = useState(false);
  const [slug, setSlug] = useState("");
  const [confirm, confirmDialog] = useConfirm();

  function run(action: () => Promise<ActionResult<undefined, AdminError>>, done: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return void toast.error(tErrors(result.error));
      toast.success(done);
      setReassigning(false);
      router.refresh();
    });
  }

  function onReassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => reassignCard(card.id, slug), t("reassigned", { code: card.code }));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={t("actionsFor", { code: card.code })}
          >
            <EllipsisIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {card.status === "disabled" ? (
            <DropdownMenuItem
              onSelect={() => run(() => setCardDisabled(card.id, false), t("enabled"))}
            >
              {t("enable")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => run(() => setCardDisabled(card.id, true), t("disabled"))}
            >
              {t("disable")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setReassigning(true)}>{t("reassign")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={card.status === "unclaimed"}
            onSelect={async () => {
              const confirmed = await confirm({
                title: t("confirmReset", { code: card.code }),
                description: t("confirmResetDescription"),
                confirmLabel: t("reset"),
                destructive: true,
              });
              if (confirmed) run(() => resetCard(card.id), t("resetDone"));
            }}
          >
            {t("reset")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reassigning} onOpenChange={setReassigning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("reassignTitle", { code: card.code })}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onReassign} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor={`reassign-${card.id}`}>{t("reassignSlug")}</FieldLabel>
              <Input
                id={`reassign-${card.id}`}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                autoCapitalize="none"
                spellCheck={false}
                required
              />
              <FieldDescription>{t("reassignHint")}</FieldDescription>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={pending || !slug.trim()}>
                {t("reassign")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}
