"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/shared/use-confirm";
import { Button } from "@/components/ui/button";

import { setUserRole } from "../actions";

type UserRoleButtonProps = { userId: string; email: string; isAdmin: boolean; isSelf: boolean };

export function UserRoleButton({ userId, email, isAdmin, isSelf }: UserRoleButtonProps) {
  const t = useTranslations("Admin.users");
  const tErrors = useTranslations("Admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();

  async function toggle() {
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

  return (
    <>
      <Button
        variant={isAdmin ? "outline" : "secondary"}
        size="sm"
        disabled={pending}
        onClick={toggle}
        aria-label={isAdmin ? t("demoteFor", { email }) : t("promoteFor", { email })}
      >
        {isAdmin ? t("demote") : t("promote")}
      </Button>
      {confirmDialog}
    </>
  );
}
