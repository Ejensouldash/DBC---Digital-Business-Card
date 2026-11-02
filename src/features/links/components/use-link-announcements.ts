"use client";

import type { Announcements, ScreenReaderInstructions, UniqueIdentifier } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

import type { ManagedLink } from "../queries";

// Screen-reader messages for drag and drop that name the link and its position,
// instead of dnd-kit's defaults, which read out internal ids.
export function useLinkAnnouncements(links: ManagedLink[]): {
  announcements: Announcements;
  screenReaderInstructions: ScreenReaderInstructions;
} {
  const t = useTranslations("Links.dnd");
  const tTypes = useTranslations("Profile.linkTypes");
  const total = links.length;
  const find = (id: UniqueIdentifier) => links.findIndex((link) => link.id === id);
  const name = (id: UniqueIdentifier) => {
    const link = links[find(id)];
    return link ? link.label || tTypes(link.type) : "";
  };
  const position = (id: UniqueIdentifier) => find(id) + 1;

  return {
    screenReaderInstructions: { draggable: t("instructions") },
    announcements: {
      onDragStart: ({ active }) =>
        t("picked", { name: name(active.id), position: position(active.id), total }),
      onDragOver: ({ active, over }) =>
        over
          ? t("moved", { name: name(active.id), position: position(over.id), total })
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? t("dropped", { name: name(active.id), position: position(over.id), total })
          : t("cancelled", { name: name(active.id) }),
      onDragCancel: ({ active }) => t("cancelled", { name: name(active.id) }),
    },
  };
}
