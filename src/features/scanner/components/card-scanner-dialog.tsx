"use client";

import * as React from "react";
import {
  Building2Icon,
  CameraIcon,
  CheckIcon,
  CreditCardIcon,
  DownloadIcon,
  EyeIcon,
  GlobeIcon,
  ImageIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PaletteIcon,
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

  // Drag and drop hover state
  const [isDragging, setIsDragging] = React.useState(false);

  // Mobile review tab switcher ("form" | "preview")
  const [activeMobileTab, setActiveMobileTab] = React.useState<"form" | "preview">("form");

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
        setIsDragging(false);
        setActiveMobileTab("form");
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
          <Button className="gap-2 shadow-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white">
            <CameraIcon className="size-4" />
            <span>{t("scanButton")}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className={
          step === "review"
            ? "w-full max-w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-slate-200 bg-white shadow-xl"
            : "w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-slate-200 bg-white shadow-xl"
        }
      >
        {/* Header - Pinned at top */}
        <div className="p-5 sm:p-6 pb-3 border-b border-slate-100 shrink-0">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-500/25 shadow-2xs">
                  <SparklesIcon className="size-4.5" />
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  {step === "review" ? t("reviewTitle") : t("title")}
                </DialogTitle>
              </div>

              {step === "review" && modelUsed ? (
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex text-[11px] py-0.5 px-2.5 border-teal-200 bg-teal-50/80 text-teal-700 font-mono"
                >
                  {modelUsed}
                </Badge>
              ) : null}
            </div>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              {step === "review" ? t("reviewDescription") : t("description")}
            </DialogDescription>
          </DialogHeader>

          {/* Mobile View Switcher (Only in Review step on mobile) */}
          {step === "review" && (
            <div className="mt-3.5 grid grid-cols-2 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 md:hidden">
              <button
                type="button"
                onClick={() => setActiveMobileTab("form")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMobileTab === "form"
                    ? "bg-white text-teal-800 shadow-2xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <UserIcon className="size-3.5" />
                <span>{t("tabDetails")}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMobileTab("preview")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMobileTab === "preview"
                    ? "bg-white text-teal-800 shadow-2xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <CreditCardIcon className="size-3.5" />
                <span>{t("tabPreview")}</span>
              </button>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: CAPTURE / UPLOAD (Clean, Minimalist Dropzone for Laptop & Mobile)
        ───────────────────────────────────────────────────────────── */}
        {step === "capture" && (
          <div className="flex flex-col gap-5 px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
            {/* Hidden native file inputs */}
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

            {/* Clean Interactive AI Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessFile(file);
              }}
              className={`group relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-6 sm:p-9 text-center transition-all cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-teal-500 bg-teal-50/60 shadow-md scale-[1.01]"
                  : "border-slate-200 bg-gradient-to-b from-teal-50/30 via-white to-slate-50/50 hover:border-teal-400 hover:bg-teal-50/40 hover:shadow-sm"
              }`}
            >
              {/* High-tech Viewfinder Brackets */}
              <div className="absolute top-2.5 left-2.5 size-3.5 border-t-2 border-l-2 border-teal-500/70 rounded-tl-sm pointer-events-none transition-transform group-hover:scale-110" />
              <div className="absolute top-2.5 right-2.5 size-3.5 border-t-2 border-r-2 border-teal-500/70 rounded-tr-sm pointer-events-none transition-transform group-hover:scale-110" />
              <div className="absolute bottom-2.5 left-2.5 size-3.5 border-b-2 border-l-2 border-teal-500/70 rounded-bl-sm pointer-events-none transition-transform group-hover:scale-110" />
              <div className="absolute bottom-2.5 right-2.5 size-3.5 border-b-2 border-r-2 border-teal-500/70 rounded-br-sm pointer-events-none transition-transform group-hover:scale-110" />

              {/* Holographic 3D Card Centerpiece */}
              <div className="relative">
                <div className="flex size-20 sm:size-22 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-teal-400 group-hover:shadow-md">
                  <CreditCardIcon className="size-10 sm:size-11 text-teal-600 transition-transform group-hover:rotate-2" />

                  {/* Smart chip icon on card */}
                  <div className="absolute top-2 left-2 size-3 rounded-xs bg-amber-400 border border-amber-600/40 opacity-90" />

                  {/* Green Leaf Accent badge */}
                  <div className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                    <SparklesIcon className="size-3.5 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Prompt Text */}
              <div className="space-y-1.5 max-w-sm">
                <p className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                  {isDragging ? "Drop card now to scan" : t("dragDropHint")}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{t("tip")}</p>
              </div>

              {/* Sleek CTA Button inside Dropzone */}
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/90 px-4 py-1.5 text-xs font-semibold text-teal-700 group-hover:bg-teal-100 transition-all shadow-2xs">
                  <UploadIcon className="size-3.5" />
                  <span>{t("browseFiles")}</span>
                </span>
              </div>

              {/* File format specifier */}
              <p className="text-[11px] text-slate-400 font-mono">
                {t("supportedFormats")}
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-900">⚡ 1s Scan</span>
                <span className="text-[10px] text-slate-500">{t("featureOcr")}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-900">🎨 Palette</span>
                <span className="text-[10px] text-slate-500">{t("featurePalette")}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-900">📇 vCard</span>
                <span className="text-[10px] text-slate-500">{t("featureVCard")}</span>
              </div>
            </div>

            {/* Quick Actions (Camera on mobile, File picker) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                className="h-11 sm:h-12 gap-2 rounded-xl font-semibold shadow-xs bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => cameraInputRef.current?.click()}
              >
                <CameraIcon className="size-4.5" />
                <span>{t("takePhoto")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-12 gap-2 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
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
          <div className="flex flex-col items-center justify-center gap-6 px-5 py-10 text-center sm:px-6">
            {/* Card preview with scanning beam animation */}
            <div className="relative h-48 w-80 max-w-full overflow-hidden rounded-2xl border border-teal-200 bg-slate-100 shadow-lg">
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Scanning card"
                  className="size-full object-cover opacity-75"
                />
              )}
              {/* Radar beam animation */}
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_15px_#0d9488] animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-teal-500/30">
                  <Loader2Icon className="size-7 animate-spin text-teal-600" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-900 flex items-center justify-center gap-2">
                <SparklesIcon className="size-4.5 text-teal-600 animate-bounce" />
                {t("analyzing")}
              </h3>
              <p className="text-xs text-slate-500">{t("analyzingHint")}</p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 3: REVIEW & EDIT (Zero horizontal overflow, clean mobile flow)
        ───────────────────────────────────────────────────────────── */}
        {step === "review" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Content Body */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 p-4 sm:p-6 space-y-6">
              {/* ──────────────────────────────────────────────────────────
                  DESKTOP VIEW (md:): Side-by-Side Dual Pane
                  MOBILE VIEW (< md): Tabbed View (Details or Preview)
              ────────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full min-w-0">
                {/* ────────────────────────────────────────────────────────
                    LEFT PANE / TAB: Original Photo + AI Digital Card
                ──────────────────────────────────────────────────────── */}
                <div
                  className={`md:col-span-5 flex-col gap-4 ${
                    activeMobileTab === "preview" ? "flex" : "hidden md:flex"
                  }`}
                >
                  {/* Digital Card Preview */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <SparklesIcon className="size-3.5 text-teal-600" />
                        {t("cardPreview")}
                      </span>

                      {/* Color Palette Indicators */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <PaletteIcon className="size-3" />
                        <div
                          className="size-3 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: cardDesign?.dominantColor || "#00a8b6" }}
                          title={`Background: ${cardDesign?.dominantColor || "#00a8b6"}`}
                        />
                        <div
                          className="size-3 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: cardDesign?.accentColor || "#8cc63f" }}
                          title={`Accent: ${cardDesign?.accentColor || "#8cc63f"}`}
                        />
                        <div
                          className="size-3 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: cardDesign?.textColor || "#0f172a" }}
                          title={`Text: ${cardDesign?.textColor || "#0f172a"}`}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: cardDesign?.dominantColor || "#ffffff",
                        color: cardDesign?.textColor || "#0f172a",
                        borderColor: cardDesign?.accentColor
                          ? `${cardDesign.accentColor}50`
                          : "#e2e8f0",
                      }}
                      className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl border p-4 shadow-md flex flex-col justify-between transition-colors bg-white"
                    >
                      {/* Ambient glow using accent color */}
                      <div
                        style={{
                          background: `radial-gradient(circle at 85% 15%, ${cardDesign?.accentColor || "#8cc63f"}30, transparent 65%)`,
                        }}
                        className="absolute inset-0 pointer-events-none"
                      />

                      {/* Card Top: Chip + Company */}
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          {/* Realistic Smart Card Chip */}
                          <div className="relative h-6 w-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-2xs ring-1 ring-amber-300/40">
                            <div className="size-full rounded-xs border border-amber-900/30 grid grid-cols-2 gap-0.5 opacity-80" />
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
                            style={{ color: cardDesign?.accentColor || "#00a8b6" }}
                            className="text-xs font-semibold truncate"
                          >
                            {jobTitle}
                          </span>
                        ) : null}
                      </div>

                      {/* Card Bottom: Quick Contact Snippets */}
                      <div className="flex flex-col gap-0.5 text-[11px] opacity-85 relative z-10 border-t border-slate-200/80 pt-2">
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

                  {/* Physical Card Photo Preview */}
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <ImageIcon className="size-3.5" />
                      {t("originalPhoto")}
                    </span>
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
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

                  {/* Switch to Form Button on Mobile */}
                  <div className="pt-2 md:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 gap-2 border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-50"
                      onClick={() => setActiveMobileTab("form")}
                    >
                      <UserIcon className="size-4" />
                      <span>Continue to Edit Details</span>
                    </Button>
                  </div>
                </div>

                {/* ────────────────────────────────────────────────────────
                    RIGHT PANE / TAB: Form Fields
                ──────────────────────────────────────────────────────── */}
                <div
                  className={`md:col-span-7 flex-col gap-4.5 w-full min-w-0 ${
                    activeMobileTab === "form" ? "flex" : "hidden md:flex"
                  }`}
                >
                  {/* Mobile Quick Summary Pill (When on mobile form tab) */}
                  <div className="md:hidden flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-sm">
                        {name ? name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate text-slate-900">
                          {name || "Untitled Contact"}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {company || jobTitle || "Business Card"}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-teal-700 hover:bg-teal-50 shrink-0 font-medium"
                      onClick={() => setActiveMobileTab("preview")}
                    >
                      <EyeIcon className="size-3.5" />
                      <span>View Card</span>
                    </Button>
                  </div>

                  {/* Profile Selector */}
                  {profiles.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="target-profile" className="text-xs font-semibold text-slate-700">
                        {t("targetProfile")}
                      </Label>
                      <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                        <SelectTrigger id="target-profile" className="w-full h-10 border-slate-200 bg-white">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Label htmlFor="contact-name" className="text-xs font-semibold text-slate-700">
                        {t("name")} *
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 size-4 text-slate-400" />
                        <Input
                          id="contact-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="pl-9 h-10 border-slate-200 bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Label htmlFor="contact-title" className="text-xs font-semibold text-slate-700">
                        {t("jobTitle")}
                      </Label>
                      <Input
                        id="contact-title"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Managing Director"
                        className="h-10 border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Company & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Label htmlFor="contact-company" className="text-xs font-semibold text-slate-700">
                        {t("company")}
                      </Label>
                      <div className="relative">
                        <Building2Icon className="absolute left-3 top-3 size-4 text-slate-400" />
                        <Input
                          id="contact-company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Acme Corp"
                          className="pl-9 h-10 border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Label htmlFor="contact-phone" className="text-xs font-semibold text-slate-700">
                        {t("phone")}
                      </Label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-3 size-4 text-slate-400" />
                        <Input
                          id="contact-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+60123456789"
                          className="pl-9 h-10 border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Website */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Label htmlFor="contact-email" className="text-xs font-semibold text-slate-700">
                        {t("email")}
                      </Label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-3 size-4 text-slate-400" />
                        <Input
                          id="contact-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="pl-9 h-10 border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Label htmlFor="contact-website" className="text-xs font-semibold text-slate-700">
                        {t("website")}
                      </Label>
                      <div className="relative">
                        <GlobeIcon className="absolute left-3 top-3 size-4 text-slate-400" />
                        <Input
                          id="contact-website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://example.com"
                          className="pl-9 h-10 border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <Label htmlFor="contact-address" className="text-xs font-semibold text-slate-700">
                      {t("address")}
                    </Label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-3 size-4 text-slate-400" />
                      <Input
                        id="contact-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Level 12, Tower 1, Kuala Lumpur"
                        className="pl-9 h-10 border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <Label htmlFor="contact-notes" className="text-xs font-semibold text-slate-700">
                      {t("notes")}
                    </Label>
                    <Textarea
                      id="contact-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Key services, product notes or met at networking event..."
                      rows={2}
                      className="text-xs resize-none border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer - Fixed at bottom, zero horizontal overflow */}
            <div className="p-3.5 sm:p-4.5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0">
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-slate-500 hover:text-slate-800 justify-center sm:justify-start"
                  onClick={() => setStep("capture")}
                  disabled={isSaving}
                >
                  <RefreshCwIcon className="size-3.5" />
                  <span>{t("scanAgain")}</span>
                </Button>

                {/* On mobile: 50/50 grid layout to guarantee NO overflow */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 sm:h-9 gap-1.5 text-xs font-medium border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
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
                    className="h-10 sm:h-9 gap-1.5 text-xs font-semibold shadow-xs bg-teal-600 hover:bg-teal-700 text-white"
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
