import type { Profile } from "@/lib/db/schema";
import { DEFAULT_THEME, parseTheme } from "@/lib/profile-theme";

import type { ProfileFormInput } from "../schemas";

export const EMPTY_PROFILE: ProfileFormInput = {
  slug: "",
  displayName: "",
  jobTitle: "",
  company: "",
  bio: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  mapsUrl: "",
  location: "",
  industry: "",
  officePhone: "",
  companyWebsite: "",
  isPublished: true,
  allowIndexing: false,
  leadFormEnabled: false,
  theme: DEFAULT_THEME,
};

// Form inputs are strings; the schema turns blanks back into nulls on save.
export function toFormInput(profile: Profile): ProfileFormInput {
  return {
    slug: profile.slug,
    displayName: profile.displayName,
    jobTitle: profile.jobTitle ?? "",
    company: profile.company ?? "",
    bio: profile.bio ?? "",
    phone: profile.phone ?? "",
    whatsapp: profile.whatsapp ?? "",
    email: profile.email ?? "",
    website: profile.website ?? "",
    address: profile.address ?? "",
    mapsUrl: profile.mapsUrl ?? "",
    location: profile.location ?? "",
    industry: profile.industry ?? "",
    officePhone: profile.officePhone ?? "",
    companyWebsite: profile.companyWebsite ?? "",
    isPublished: profile.isPublished,
    allowIndexing: profile.allowIndexing,
    leadFormEnabled: profile.leadFormEnabled,
    theme: parseTheme(profile.theme),
  };
}
