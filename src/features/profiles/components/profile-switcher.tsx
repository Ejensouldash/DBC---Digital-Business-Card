"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { OwnerProfileSummary } from "../queries";

const NEW_PROFILE = "__new__";

type ProfileSwitcherProps = { profiles: OwnerProfileSummary[]; currentId: string | null };

export function ProfileSwitcher({ profiles, currentId }: ProfileSwitcherProps) {
  const t = useTranslations("ProfileEditor");
  const router = useRouter();

  return (
    <Select
      value={currentId ?? NEW_PROFILE}
      onValueChange={(value) =>
        router.push(
          value === NEW_PROFILE
            ? "/dashboard/profile?new=1"
            : `/dashboard/profile?profile=${value}`,
        )
      }
    >
      <SelectTrigger className="w-56" aria-label={t("switchProfile")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            {profile.displayName} (/{profile.slug})
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={NEW_PROFILE}>{t("newProfile")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
