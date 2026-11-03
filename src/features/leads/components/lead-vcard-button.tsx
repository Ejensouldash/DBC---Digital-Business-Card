"use client";

import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildContactVCard, type ContactVCardData } from "@/lib/vcard";

type LeadVCardButtonProps = {
  contact: ContactVCardData;
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "icon";
  className?: string;
  showText?: boolean;
};

export function LeadVCardButton({
  contact,
  variant = "outline",
  size = "sm",
  className,
  showText = true,
}: LeadVCardButtonProps) {
  const handleDownload = () => {
    try {
      const vcard = buildContactVCard(contact);
      const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = contact.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "contact";
      link.download = `${safeName}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("vCard (.vcf) downloaded");
    } catch (err) {
      console.error("Failed to build vCard", err);
      toast.error("Failed to generate contact card");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      title="Download vCard contact file"
    >
      <DownloadIcon className="size-3.5" />
      {showText ? <span>vCard</span> : null}
    </Button>
  );
}
