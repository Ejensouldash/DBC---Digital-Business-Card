"use client";

import * as React from "react";
import {
  CreditCardIcon,
  GlobeIcon,
  ImageIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CardDesignMetadata } from "@/lib/db/schema";

import { LeadVCardButton } from "./lead-vcard-button";

type ViewScannedCardDialogProps = {
  lead: {
    id: string;
    name: string;
    company?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    message?: string | null;
    cardDesign?: CardDesignMetadata | null;
  };
  cardImageUrl?: string | null;
  trigger?: React.ReactNode;
};

export function ViewScannedCardDialog({
  lead,
  cardImageUrl,
  trigger,
}: ViewScannedCardDialogProps) {
  const [open, setOpen] = React.useState(false);
  const design = lead.cardDesign;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-violet-500/30 bg-violet-500/5 px-2.5 text-xs font-medium text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/50 transition-colors"
          >
            <CreditCardIcon className="size-3.5" />
            <span>View Card</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
              <SparklesIcon className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              Scanned Business Card
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Physical card capture and AI-generated digital replica for {lead.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-3">
          {/* Card Graphic */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <SparklesIcon className="size-3.5 text-violet-400" />
                Digital Replica
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-violet-500/30 text-violet-300">
                AI Extracted
              </Badge>
            </div>

            <div
              style={{
                backgroundColor: design?.dominantColor || "#0f172a",
                color: design?.textColor || "#ffffff",
                borderColor: design?.accentColor ? `${design.accentColor}40` : "rgba(255,255,255,0.15)",
              }}
              className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl border p-5 shadow-2xl flex flex-col justify-between"
            >
              {/* Ambient gradient */}
              <div
                style={{
                  background: `radial-gradient(circle at 85% 15%, ${design?.accentColor || "#8b5cf6"}50, transparent 65%)`,
                }}
                className="absolute inset-0 pointer-events-none"
              />

              {/* Top: Chip & Company */}
              <div className="flex items-start justify-between relative z-10">
                <div className="relative h-6 w-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-sm ring-1 ring-amber-300/40">
                  <div className="size-full rounded-sm border border-amber-900/30 grid grid-cols-2 gap-0.5 opacity-80" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90 truncate max-w-[200px]">
                  {lead.company || "Digital Card"}
                </span>
              </div>

              {/* Middle: Name & Role */}
              <div className="flex flex-col min-w-0 relative z-10 my-auto">
                <span className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  {lead.name}
                </span>
                {lead.jobTitle ? (
                  <span
                    style={{ color: design?.accentColor || "#a78bfa" }}
                    className="text-xs sm:text-sm font-semibold truncate"
                  >
                    {lead.jobTitle}
                  </span>
                ) : null}
              </div>

              {/* Bottom: Contact Info */}
              <div className="flex flex-col gap-1 text-[11px] opacity-85 relative z-10 border-t border-white/10 pt-2.5">
                {lead.phone ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <PhoneIcon className="size-3 shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                ) : null}
                {lead.email ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <MailIcon className="size-3 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                ) : null}
                {lead.website ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <GlobeIcon className="size-3 shrink-0" />
                    <span className="truncate">{lead.website}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Physical Photo (if available) */}
          {cardImageUrl ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="size-3.5" />
                Original Photo
              </span>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardImageUrl}
                  alt={`${lead.name}'s business card`}
                  className="size-full object-contain"
                />
              </div>
            </div>
          ) : null}

          {/* Detailed attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
            {lead.phone ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <PhoneIcon className="size-3.5 text-foreground/70" />
                <span className="text-foreground">{lead.phone}</span>
              </div>
            ) : null}
            {lead.email ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MailIcon className="size-3.5 text-foreground/70" />
                <span className="text-foreground truncate">{lead.email}</span>
              </div>
            ) : null}
            {lead.website ? (
              <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                <GlobeIcon className="size-3.5 text-foreground/70" />
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {lead.website}
                </a>
              </div>
            ) : null}
            {lead.address ? (
              <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                <MapPinIcon className="size-3.5 text-foreground/70 shrink-0 mt-0.5" />
                <span className="text-foreground">{lead.address}</span>
              </div>
            ) : null}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
            <LeadVCardButton
              contact={{
                name: lead.name,
                company: lead.company,
                jobTitle: lead.jobTitle,
                phone: lead.phone,
                email: lead.email,
                website: lead.website,
                address: lead.address,
                notes: lead.message,
              }}
              variant="outline"
              className="gap-2 text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
