import {
  AtSignIcon,
  BriefcaseIcon,
  CameraIcon,
  LinkIcon,
  MusicIcon,
  PlayIcon,
  SendIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import type { LinkType } from "@/lib/link-types";

// lucide ships no brand logos, so each platform gets a neutral icon plus its name.
export const LINK_ICONS: Record<LinkType, LucideIcon> = {
  instagram: CameraIcon,
  facebook: UsersIcon,
  tiktok: MusicIcon,
  linkedin: BriefcaseIcon,
  x: AtSignIcon,
  youtube: PlayIcon,
  telegram: SendIcon,
  custom: LinkIcon,
};
