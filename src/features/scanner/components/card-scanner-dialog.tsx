"use client";

import * as React from "react";
import {
  Building2Icon,
  CameraIcon,
  CheckIcon,
  CreditCardIcon,
  DownloadIcon,
  GlobeIcon,
  ImageIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshCwIcon,
  SparklesIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildContactVCard } from "@/lib/vcard";

import { saveScannedLead, scanCardImage } from "../actions";
import type { ExtractedBusinessCard, ExtractedCardDesign } from "../lib/gemini";
import { optimizeImageForOcr } from "../lib/image";

type ProfileOption = {
  id: string;
  displayName: string;
  slug: string;
};

type CardScannerDialogProps = {
  profiles: ProfileOption[];
  defaultProfileId?: string;
  trigger?: React.ReactNode;
  onSuccess?: (leadId: string) => void;
};

type Step = "capture" | "scanning" | "review";

export function CardScannerDialog({
  profiles,
  defaultProfileId,
  trigger,
  onSuccess,
}: CardScannerDialogProps) {
  const t = useTranslations("Scanner");
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("capture");

  // Captured / Selected image state
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [modelUsed, setModelUsed] = React.useState<string | null>(null);

  // Form Fields
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>(
    defaultProfileId || profiles[0]?.id || "",
  );
  const [name, setName] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [cardDesign, setCardDesign] = React.useState<ExtractedCardDesign | null>(null);

  const [isSaving, setIsSaving] = React.useState(false);

  // File input refs
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setStep("capture");
        setImagePreview(null);
        setModelUsed(null);
        setName("");
        setJobTitle("");
        setCompany("");
        setPhone("");
        setEmail("");
        setWebsite("");
        setAddress("");
        setNotes("");
        setCardDesign(null);
        setIsSaving(false);
      }, 200);
    }
  };

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    if (file.type && !file.type.startsWith("image/")) {
      toast.error(t("errors.no_image_provided"));
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error(t("errors.file_too_large"));
      return;
    }

    setStep("scanning");

    try {
      // Downscale high-resolution mobile camera photos (e.g. 10MB -> ~250KB)
      // to avoid Vercel 4.5MB payload limits, Next.js action limits, and timeouts.
      const { file: optimizedFile, dataUrl } = await optimizeImageForOcr(file);
      setImagePreview(dataUrl);

      const formData = new FormData();
      formData.append("image", optimizedFile);

      const result = await scanCardImage(formData);

      if (!result.ok) {
        if (result.error === "gemini_key_missing") {
          toast.error(t("errors.gemini_key_missing"), { duration: 6000 });
        } else {
          toast.error(t("errors.processing_failed"));
        }
        setStep("capture");
        return;
      }

      const data: ExtractedBusinessCard = result.data.card;
      setName(data.name || "");
      setJobTitle(data.jobTitle || "");
      setCompany(data.company || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setWebsite(data.website || "");
      setAddress(data.address || "");
      setNotes(data.notes || "");
      setCardDesign(data.design || null);
      setModelUsed(result.data.modelUsed);
      setStep("review");
    } catch (err) {
      console.error("[Card Scanner] Error processing card image:", err);
      toast.error(t("errors.processing_failed"));
      setStep("capture");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = "";
  };

  const handleSave = async (downloadVCardAfterSave = false) => {
    if (!name.trim()) {
      toast.error(t("errors.invalid_input"));
      return;
    }

    if (!selectedProfileId) {
      toast.error(t("errors.profile_not_found"));
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveScannedLead({
        profileId: selectedProfileId,
        name: name.trim(),
        company: company.trim() || null,
        jobTitle: jobTitle.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        cardDesign: cardDesign || null,
        cardImageBase64: imagePreview || null,
      });

      if (!result.ok) {
        toast.error(t(`errors.${result.error}` as const) || t("errors.database_error"));
        setIsSaving(false);
        return;
      }

      toast.success(t("savedSuccess"));

      if (downloadVCardAfterSave) {
        const vcardContent = buildContactVCard({
          name: name.trim(),
          company: company.trim() || null,
          jobTitle: jobTitle.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        });

        const blob = new Blob([vcardContent], { type: "text/vcard;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "contact"}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.info(t("vcardDownloaded"));
      }

      if (onSuccess) {
        onSuccess(result.data.leadId);
      }

      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(t("errors.database_error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="gap-2 shadow-sm font-medium">
            <CameraIcon className="size-4" />
            <span>{t("scanButton")}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className={
          step === "review"
            ? "max-w-3xl sm:max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6"
            : "max-w-md p-6"
        }
      >
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SparklesIcon className="size-4" />
            </div>
            <DialogTitle>{step === "review" ? t("reviewTitle") : t("title")}</DialogTitle>
          </div>
          <DialogDescription>
            {step === "review" ? t("reviewDescription") : t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: CAPTURE / UPLOAD
        ───────────────────────────────────────────────────────────── */}
        {step === "capture" && (
          <div className="flex flex-col gap-5 pt-3">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Drag & Drop Visual Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessFile(file);
              }}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/[0.03] cursor-pointer"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 group-hover:scale-105 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <CreditCardIcon className="size-7 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{t("dragDropHint")}</p>
                <p className="text-xs text-muted-foreground">{t("tip")}</p>
              </div>
            </div>

            {/* Quick Actions (Camera on mobile, File picker) */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-xl border-white/10"
                onClick={() => cameraInputRef.current?.click()}
              >
                <CameraIcon className="size-4 text-primary" />
                <span>{t("takePhoto")}</span>
              </Button>

              <Button
                type="button"
                className="h-11 gap-2 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="size-4" />
                <span>{t("uploadImage")}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 2: SCANNING / ANALYZING ANIMATION
        ───────────────────────────────────────────────────────────── */}
        {step === "scanning" && (
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
            {/* Card preview with scanning beam animation */}
            <div className="relative h-44 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Scanning card"
                  className="size-full object-cover opacity-60"
                />
              )}
              {/* Radar beam animation */}
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/20">
                  <Loader2Icon className="size-6 animate-spin text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground flex items-center justify-center gap-2">
                <SparklesIcon className="size-4 text-primary animate-bounce" />
                {t("analyzing")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("analyzingHint")}</p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 3: REVIEW & EDIT
        ───────────────────────────────────────────────────────────── */}
        {step === "review" && (
          <div className="flex flex-col gap-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* LEFT / TOP COLUMN: Physical Photo + AI Generated Digital Card */}
              <div className="md:col-span-5 flex flex-col gap-4">
                {/* Physical Card Photo */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5" />
                    {t("originalPhoto")}
                  </span>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-md">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt="Scanned card photo"
                        className="size-full object-contain"
                      />
                    ) : null}
                  </div>
                </div>

                {/* AI-Extracted Digital Card Graphic */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <SparklesIcon className="size-3.5 text-primary" />
                      {t("cardPreview")}
                    </span>
                    {modelUsed ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-white/10">
                        {modelUsed}
                      </Badge>
                    ) : null}
                  </div>

                  <div
                    style={{
                      backgroundColor: cardDesign?.dominantColor || "#0f172a",
                      color: cardDesign?.textColor || "#ffffff",
                      borderColor: cardDesign?.accentColor ? `${cardDesign.accentColor}40` : "rgba(255,255,255,0.15)",
                    }}
                    className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl border p-4 shadow-xl flex flex-col justify-between transition-colors"
                  >
                    {/* Card background ambient glow using accent color */}
                    <div
                      style={{
                        background: `radial-gradient(circle at 85% 15%, ${cardDesign?.accentColor || "#6366f1"}55, transparent 60%)`,
                      }}
                      className="absolute inset-0 pointer-events-none"
                    />

                    {/* Card Top: Chip + Company */}
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        {/* Realistic Smart Card Chip */}
                        <div className="relative h-6 w-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-sm ring-1 ring-amber-300/40">
                          <div className="size-full rounded-sm border border-amber-900/30 grid grid-cols-2 gap-0.5 opacity-80" />
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-90 truncate max-w-[150px]">
                        {company || "Digital Card"}
                      </span>
                    </div>

                    {/* Card Middle: Name + Role */}
                    <div className="flex flex-col min-w-0 relative z-10 my-auto">
                      <span className="text-base sm:text-lg font-bold tracking-tight truncate">
                        {name || "Contact Name"}
                      </span>
                      {jobTitle ? (
                        <span
                          style={{ color: cardDesign?.accentColor || "#818cf8" }}
                          className="text-xs font-semibold truncate"
                        >
                          {jobTitle}
                        </span>
                      ) : null}
                    </div>

                    {/* Card Bottom: Quick Contact Snippets */}
                    <div className="flex flex-col gap-0.5 text-[11px] opacity-85 relative z-10 border-t border-white/10 pt-2">
                      {phone ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <PhoneIcon className="size-3 shrink-0" />
                          <span className="truncate">{phone}</span>
                        </div>
                      ) : null}
                      {email ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <MailIcon className="size-3 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT / BOTTOM COLUMN: Editable Form Fields */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {/* Profile Selector */}
                {profiles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="target-profile" className="text-xs font-medium">
                      {t("targetProfile")}
                    </Label>
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger id="target-profile" className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.displayName} (/p/{p.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Name & Job Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contact-name" className="text-xs font-medium">
                      {t("name")} *
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="contact-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-9 h-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contact-title" className="text-xs font-medium">
                      {t("jobTitle")}
                    </Label>
                    <Input
                      id="contact-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Managing Director"
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Company & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contact-company" className="text-xs font-medium">
                      {t("company")}
                    </Label>
                    <div className="relative">
                      <Building2Icon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="contact-company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contact-phone" className="text-xs font-medium">
                      {t("phone")}
                    </Label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="contact-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+60123456789"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contact-email" className="text-xs font-medium">
                      {t("email")}
                    </Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contact-website" className="text-xs font-medium">
                      {t("website")}
                    </Label>
                    <div className="relative">
                      <GlobeIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="contact-website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-address" className="text-xs font-medium">
                    {t("address")}
                  </Label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="contact-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Level 12, Tower 1, Kuala Lumpur"
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-notes" className="text-xs font-medium">
                    {t("notes")}
                  </Label>
                  <Textarea
                    id="contact-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key services, product notes or met at networking event..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={() => setStep("capture")}
                disabled={isSaving}
              >
                <RefreshCwIcon className="size-3.5" />
                <span>{t("scanAgain")}</span>
              </Button>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 text-xs"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <DownloadIcon className="size-3.5" />
                  )}
                  <span>{t("saveAndVCard")}</span>
                </Button>

                <Button
                  type="button"
                  className="w-full sm:w-auto gap-2 text-xs"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <CheckIcon className="size-3.5" />
                  )}
                  <span>{isSaving ? t("saving") : t("saveToLeads")}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
