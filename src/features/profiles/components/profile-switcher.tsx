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

type ProfileSwitcherProps = {
  profiles: OwnerProfileSummary[];
  currentId: string | null;
  // Page to reload with ?profile=<id>, e.g. "/dashboard/links".
  basePath: string;
  // Offer "+ New profile" (only the profile editor can create one).
  allowNew?: boolean;
};

export function ProfileSwitcher({
  profiles,
  currentId,
  basePath,
  allowNew = false,
}: ProfileSwitcherProps) {
  const t = useTranslations("ProfileEditor");
  const router = useRouter();

  return (
    <Select
      value={currentId ?? NEW_PROFILE}
      onValueChange={(value) =>
        router.push(value === NEW_PROFILE ? `${basePath}?new=1` : `${basePath}?profile=${value}`)
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
        {allowNew ? (
          <>
            <SelectSeparator />
            <SelectItem value={NEW_PROFILE}>{t("newProfile")}</SelectItem>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}
