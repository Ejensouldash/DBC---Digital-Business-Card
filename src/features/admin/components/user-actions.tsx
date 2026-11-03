"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/shared/use-confirm";
import { Button } from "@/components/ui/button";

import { deleteUser, setUserRole } from "../actions";

type UserActionsProps = {
  userId: string;
  email: string;
  isAdmin: boolean;
  isSelf: boolean;
};

export function UserActions({ userId, email, isAdmin, isSelf }: UserActionsProps) {
  const t = useTranslations("Admin.users");
  const tErrors = useTranslations("Admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();

  async function toggleRole() {
    const confirmed = await confirm(
      isAdmin
        ? {
            title: t(isSelf ? "confirmDemoteSelf" : "confirmDemote", { email }),
            description: isSelf ? t("confirmDemoteSelfDescription") : undefined,
            confirmLabel: t("demote"),
            destructive: true,
          }
        : { title: t("confirmPromote", { email }), confirmLabel: t("promote") },
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await setUserRole(userId, isAdmin ? "user" : "admin");
      if (!result.ok) return void toast.error(tErrors(result.error));
      toast.success(isAdmin ? t("demoted", { email }) : t("promoted", { email }));
      router.refresh();
    });
  }

  async function handleDelete() {
    if (isSelf) return;

    const confirmed = await confirm({
      title: t("confirmDelete", { email }),
      description: t("confirmDeleteDescription"),
      confirmLabel: t("delete"),
      destructive: true,
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.ok) return void toast.error(tErrors(result.error));
      toast.success(t("deleteDone"));
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant={isAdmin ? "outline" : "secondary"}
          size="sm"
          disabled={pending}
          onClick={toggleRole}
          aria-label={isAdmin ? t("demoteFor", { email }) : t("promoteFor", { email })}
        >
          {isAdmin ? t("demote") : t("promote")}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending || isSelf}
          aria-label={t("deleteFor", { email })}
          title={isSelf ? t("cannotDeleteSelf") : t("delete")}
          onClick={handleDelete}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
        >
          {pending ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2Icon className="size-3.5" aria-hidden />
          )}
        </Button>
      </div>
      {confirmDialog}
    </>
  );
}
