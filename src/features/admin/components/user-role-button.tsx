"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { setUserRole } from "../actions";

type UserRoleButtonProps = { userId: string; email: string; isAdmin: boolean; isSelf: boolean };

export function UserRoleButton({ userId, email, isAdmin, isSelf }: UserRoleButtonProps) {
  const t = useTranslations("Admin.users");
  const tErrors = useTranslations("Admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const message = isAdmin
      ? t(isSelf ? "confirmDemoteSelf" : "confirmDemote", { email })
      : t("confirmPromote", { email });
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const result = await setUserRole(userId, isAdmin ? "user" : "admin");
      if (!result.ok) return void toast.error(tErrors(result.error));
      toast.success(isAdmin ? t("demoted", { email }) : t("promoted", { email }));
      router.refresh();
    });
  }

  return (
    <Button
      variant={isAdmin ? "outline" : "secondary"}
      size="sm"
      disabled={pending}
      onClick={toggle}
    >
      {isAdmin ? t("demote") : t("promote")}
    </Button>
  );
}
