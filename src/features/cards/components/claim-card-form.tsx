"use client";

import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import type { OwnerProfileSummary } from "@/features/profiles/queries";

import { claimCard } from "../actions";

import { useActivationError } from "./use-activation-error";

type ClaimCardFormProps = { code: string; profiles: OwnerProfileSummary[] };

export function ClaimCardForm({ code, profiles }: ClaimCardFormProps) {
  const t = useTranslations("Activate");
  const errorMessage = useActivationError();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await claimCard(code, profileId);
      if (!result.ok) {
        toast.error(errorMessage(result.error));
        return;
      }
      router.replace("/dashboard?claimed=1");
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">{t("chooseProfile")}</FieldLegend>
          <div className="flex flex-col gap-2">
            {profiles.map((profile) => (
              <label
                key={profile.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="radio"
                  name="profileId"
                  value={profile.id}
                  checked={profileId === profile.id}
                  onChange={() => setProfileId(profile.id)}
                  className="size-4 accent-primary"
                />
                <span className="flex flex-col">
                  <span className="font-medium">{profile.displayName}</span>
                  <span className="text-sm text-muted-foreground">/p/{profile.slug}</span>
                </span>
              </label>
            ))}
          </div>
        </FieldSet>
        <Button type="submit" disabled={pending || !profileId}>
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          {t("claim")}
        </Button>
      </FieldGroup>
    </form>
  );
}
