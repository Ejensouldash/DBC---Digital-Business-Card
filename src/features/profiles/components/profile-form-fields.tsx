"use client";

import {
  Building2Icon,
  ChevronDownIcon,
  PaletteIcon,
  PhoneCallIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Controller, type Control } from "react-hook-form";

import { FormTextField } from "@/components/shared/form-text-field";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { ProfileFormInput, ProfileFormValues } from "../schemas";

import { ThemeFields } from "./theme-fields";

type FieldsProps = {
  control: Control<ProfileFormInput, unknown, ProfileFormValues>;
  slugHint: string;
};

type AccordionSectionProps = {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

function AccordionSection({
  id,
  isOpen,
  onToggle,
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
}: AccordionSectionProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-200",
        isOpen
          ? "border-teal-500/40 bg-white shadow-xs ring-1 ring-teal-500/20"
          : "border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs",
      )}
    >
      <button
        type="button"
        id={`header-${id}`}
        aria-controls={`content-${id}`}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconColor)}>
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        </div>
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-lg bg-slate-100 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-foreground",
          )}
        >
          <ChevronDownIcon className="size-4" aria-hidden />
        </div>
      </button>

      {isOpen && (
        <div
          id={`content-${id}`}
          aria-labelledby={`header-${id}`}
          className="border-t border-slate-100 px-4 pt-3 pb-5"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleField({
  control,
  name,
  label,
  description,
}: {
  control: FieldsProps["control"];
  name: "isPublished" | "allowIndexing" | "leadFormEnabled";
  label: string;
  description: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <FieldDescription>{description}</FieldDescription>
          </FieldContent>
          <Switch id={name} checked={field.value} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  );
}

export function ProfileFormFields({ control, slugHint }: FieldsProps) {
  const t = useTranslations("ProfileEditor");

  // Keep 'about' open by default, users can toggle others as needed
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    about: true,
    company: false,
    contact: false,
    appearance: false,
    visibility: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. About You */}
      <AccordionSection
        id="about"
        isOpen={openSections.about}
        onToggle={() => toggleSection("about")}
        icon={UserRoundIcon}
        iconColor="bg-teal-50 text-teal-600 ring-1 ring-teal-500/25"
        title={t("sections.about")}
        subtitle="Display name, profile link, title & bio"
      >
        <FieldGroup>
          <FormTextField
            control={control}
            name="displayName"
            label={t("fields.displayName")}
            autoComplete="name"
          />
          <FormTextField
            control={control}
            name="slug"
            label={t("fields.slug")}
            description={slugHint}
            autoCapitalize="none"
            spellCheck={false}
          />
          <FormTextField control={control} name="jobTitle" label={t("fields.jobTitle")} />
          <FormTextField
            control={control}
            name="location"
            label={t("fields.location")}
            placeholder={t("hints.locationPlaceholder")}
          />
          <FormTextField control={control} name="bio" label={t("fields.bio")} multiline />
        </FieldGroup>
      </AccordionSection>

      {/* 2. Company */}
      <AccordionSection
        id="company"
        isOpen={openSections.company}
        onToggle={() => toggleSection("company")}
        icon={Building2Icon}
        iconColor="bg-sky-50 text-sky-600 ring-1 ring-sky-500/25"
        title={t("sections.company")}
        subtitle="Organization, industry & company links"
      >
        <FieldGroup>
          <FormTextField
            control={control}
            name="company"
            label={t("fields.company")}
            autoComplete="organization"
          />
          <FormTextField control={control} name="industry" label={t("fields.industry")} />
          <FormTextField
            control={control}
            name="companyWebsite"
            label={t("fields.companyWebsite")}
            type="url"
            placeholder="https://"
          />
          <FormTextField
            control={control}
            name="officePhone"
            label={t("fields.officePhone")}
            type="tel"
          />
        </FieldGroup>
      </AccordionSection>

      {/* 3. Contact */}
      <AccordionSection
        id="contact"
        isOpen={openSections.contact}
        onToggle={() => toggleSection("contact")}
        icon={PhoneCallIcon}
        iconColor="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/25"
        title={t("sections.contact")}
        subtitle="Direct phone, WhatsApp, email & address"
      >
        <FieldGroup>
          <FormTextField
            control={control}
            name="phone"
            label={t("fields.phone")}
            type="tel"
            autoComplete="tel"
          />
          <FormTextField
            control={control}
            name="whatsapp"
            label={t("fields.whatsapp")}
            description={t("hints.whatsapp")}
            type="tel"
          />
          <FormTextField
            control={control}
            name="email"
            label={t("fields.email")}
            type="email"
            autoComplete="email"
          />
          <FormTextField
            control={control}
            name="website"
            label={t("fields.website")}
            type="url"
            placeholder="https://"
          />
          <FormTextField control={control} name="address" label={t("fields.address")} multiline />
          <FormTextField
            control={control}
            name="mapsUrl"
            label={t("fields.mapsUrl")}
            description={t("hints.mapsUrl")}
            type="url"
            placeholder="https://maps.app.goo.gl/…"
          />
        </FieldGroup>
      </AccordionSection>

      {/* 4. Appearance / Theme */}
      <AccordionSection
        id="appearance"
        isOpen={openSections.appearance}
        onToggle={() => toggleSection("appearance")}
        icon={PaletteIcon}
        iconColor="bg-teal-50 text-teal-600 ring-1 ring-teal-500/25"
        title={t("theme.title")}
        subtitle="Button accent colours & layout style"
      >
        <ThemeFields control={control} embedded />
      </AccordionSection>

      {/* 5. Visibility & Settings */}
      <AccordionSection
        id="visibility"
        isOpen={openSections.visibility}
        onToggle={() => toggleSection("visibility")}
        icon={SlidersHorizontalIcon}
        iconColor="bg-amber-50 text-amber-600 ring-1 ring-amber-500/25"
        title={t("sections.visibility")}
        subtitle="Publishing status & lead exchange options"
      >
        <FieldGroup>
          <ToggleField
            control={control}
            name="isPublished"
            label={t("fields.isPublished")}
            description={t("hints.isPublished")}
          />
          <ToggleField
            control={control}
            name="allowIndexing"
            label={t("fields.allowIndexing")}
            description={t("hints.allowIndexing")}
          />
          <ToggleField
            control={control}
            name="leadFormEnabled"
            label={t("fields.leadFormEnabled")}
            description={t("hints.leadFormEnabled")}
          />
        </FieldGroup>
      </AccordionSection>
    </div>
  );
}
