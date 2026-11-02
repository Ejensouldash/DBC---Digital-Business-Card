"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

import {
  addLink,
  deleteLink,
  reorderLinks,
  setLinkVisibility,
  updateLink,
  type LinkError,
} from "../actions";
import type { ManagedLink } from "../queries";
import type { LinkFormInput } from "../schemas";

import { LinkDialog } from "./link-dialog";
import { SortableLinkRow } from "./sortable-link-row";
import { useLinkAnnouncements } from "./use-link-announcements";

type LinksManagerProps = { profileId: string; initialLinks: ManagedLink[] };

export function LinksManager({ profileId, initialLinks }: LinksManagerProps) {
  const t = useTranslations("Links");
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  // Adopt fresh server data after router.refresh() without an effect.
  const [serverLinks, setServerLinks] = useState(initialLinks);
  if (initialLinks !== serverLinks) {
    setServerLinks(initialLinks);
    setLinks(initialLinks);
  }
  const accessibility = useLinkAnnouncements(links);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Applies the change locally first; rolls back and reports if the server refuses it.
  async function mutate(
    next: ManagedLink[],
    action: () => Promise<ActionResult<unknown, LinkError>>,
  ) {
    const previous = links;
    setLinks(next);
    const result = await action();
    if (!result.ok) {
      setLinks(previous);
      toast.error(t(`errors.${result.error}`));
      return false;
    }
    router.refresh();
    return true;
  }

  async function add(input: LinkFormInput) {
    const result = await addLink(profileId, input);
    if (!result.ok) {
      toast.error(t(`errors.${result.error}`));
      return false;
    }
    toast.success(t("added"));
    router.refresh();
    return true;
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = links.findIndex((link) => link.id === active.id);
    const to = links.findIndex((link) => link.id === over.id);
    const next = arrayMove(links, from, to);
    void mutate(next, () =>
      reorderLinks(
        profileId,
        next.map((link) => link.id),
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <LinkDialog
          title={t("addTitle")}
          onSubmit={add}
          trigger={
            <Button>
              <PlusIcon aria-hidden />
              {t("add")}
            </Button>
          }
        />
      </div>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={accessibility}
        >
          <SortableContext items={links} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2" aria-label={t("listLabel")}>
              {links.map((link) => (
                <SortableLinkRow
                  key={link.id}
                  link={link}
                  onToggle={(isVisible) =>
                    void mutate(
                      links.map((l) => (l.id === link.id ? { ...l, isVisible } : l)),
                      () => setLinkVisibility(link.id, isVisible),
                    )
                  }
                  onEdit={async (input) => {
                    const result = await updateLink(link.id, input);
                    if (!result.ok) {
                      toast.error(t(`errors.${result.error}`));
                      return false;
                    }
                    router.refresh();
                    return true;
                  }}
                  onDelete={() => {
                    if (!window.confirm(t("confirmDelete"))) return;
                    void mutate(
                      links.filter((l) => l.id !== link.id),
                      () => deleteLink(link.id),
                    );
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
