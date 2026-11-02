"use client";

import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

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
        router.push({
          pathname: "/dashboard/profile",
          query: value === NEW_PROFILE ? { new: "1" } : { profile: value },
        })
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
