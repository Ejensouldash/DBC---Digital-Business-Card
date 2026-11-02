"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { LINK_ICONS } from "../lib/link-icons";
import type { ManagedLink } from "../queries";
import type { LinkFormInput } from "../schemas";

import { LinkDialog } from "./link-dialog";

type SortableLinkRowProps = {
  link: ManagedLink;
  onEdit: (input: LinkFormInput) => Promise<boolean>;
  onToggle: (visible: boolean) => void;
  onDelete: () => void;
};

export function SortableLinkRow({ link, onEdit, onToggle, onDelete }: SortableLinkRowProps) {
  const t = useTranslations("Links");
  const tTypes = useTranslations("Profile.linkTypes");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });
  const Icon = LINK_ICONS[link.type];
  const name = link.label || tTypes(link.type);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card p-2 pr-3",
        isDragging && "relative z-10 shadow-lg",
        !link.isVisible && "opacity-60",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        aria-label={t("reorder", { name })}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" aria-hidden />
      </button>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 grow">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{link.url}</p>
      </div>
      <Switch
        checked={link.isVisible}
        onCheckedChange={onToggle}
        aria-label={t("visible", { name })}
      />
      <LinkDialog
        title={t("editTitle")}
        defaults={{ type: link.type, label: link.label ?? "", url: link.url }}
        onSubmit={onEdit}
        trigger={
          <Button variant="ghost" size="icon" aria-label={t("edit", { name })}>
            <PencilIcon aria-hidden />
          </Button>
        }
      />
      <Button variant="ghost" size="icon" aria-label={t("delete", { name })} onClick={onDelete}>
        <Trash2Icon aria-hidden />
      </Button>
    </li>
  );
}
