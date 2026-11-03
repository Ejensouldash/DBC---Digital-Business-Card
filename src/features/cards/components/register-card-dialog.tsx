"use client";

import {
  CheckCircle2Icon,
  CopyIcon,
  Loader2Icon,
  NfcIcon,
  PlusIcon,
  SmartphoneIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { normalizeProfileUrl, useClientOrigin, useWebNfcSupport } from "@/lib/client-origin";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OwnerProfileSummary } from "@/features/profiles/queries";

import { registerOwnerCard, type RegisterCardResult } from "../actions";

type RegisterCardDialogProps = {
  profiles: OwnerProfileSummary[];
  trigger?: React.ReactNode;
};

export function RegisterCardDialog({ profiles, trigger }: RegisterCardDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [createdCard, setCreatedCard] = useState<RegisterCardResult | null>(null);

  const origin = useClientOrigin();
  const supportsWebNfc = useWebNfcSupport();
  const [writingNfc, setWritingNfc] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // If we finished creating a card, refresh the list on close
      if (createdCard) {
        router.refresh();
      }
      setLabel("");
      setCreatedCard(null);
      setWritingNfc(false);
      setNfcSuccess(false);
    }
    setOpen(nextOpen);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) {
      toast.error("Please select a profile to link this card to.");
      return;
    }

    setPending(true);
    try {
      const result = await registerOwnerCard({
        label: label.trim() || undefined,
        profileId,
      });

      if (!result.ok) {
        toast.error("Failed to register card. Please try again.");
        return;
      }

      setCreatedCard(result.data);
      toast.success("Card registered successfully!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setPending(false);
    }
  };

  const effectiveCardUrl = createdCard ? normalizeProfileUrl(createdCard.url, origin) : "";

  const copyUrl = async () => {
    if (!effectiveCardUrl) return;
    try {
      await navigator.clipboard.writeText(effectiveCardUrl);
      toast.success("Card URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL.");
    }
  };

  const handleWriteWebNfc = async () => {
    if (!effectiveCardUrl) return;
    setWritingNfc(true);
    setNfcSuccess(false);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web NFC API standard
      const ndef = new (window as any).NDEFReader();
      toast.info("Hold your NFC card against the back of your phone...");
      await ndef.write({
        records: [{ recordType: "url", data: effectiveCardUrl }],
      });
      setNfcSuccess(true);
      toast.success("Successfully written to NFC card!");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? `NFC write error: ${err.message}` : "NFC write cancelled or failed.",
      );
    } finally {
      setWritingNfc(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 font-medium">
            <PlusIcon className="size-4" aria-hidden />
            <span>Register new card</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md sm:max-w-lg">
        {!createdCard ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <NfcIcon className="size-5 text-primary" />
                <span>Register new NFC card</span>
              </DialogTitle>
              <DialogDescription>
                Add a physical NFC card to your account. The system generates a dedicated chip
                redirect URL so every tap is recorded as an NFC tap.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <Field>
                <FieldLabel htmlFor="card-label">Card label (optional)</FieldLabel>
                <Input
                  id="card-label"
                  placeholder="e.g. Matte Black Card, Primary Business Card"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={50}
                />
                <FieldDescription>
                  A friendly nickname to distinguish this card in your dashboard.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="card-profile">Link to profile</FieldLabel>
                <Select value={profileId} onValueChange={setProfileId}>
                  <SelectTrigger id="card-profile">
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.displayName} (/{p.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  When someone taps this card, it will redirect straight to this profile.
                </FieldDescription>
              </Field>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !profileId}>
                {pending ? (
                  <>
                    <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-1.5 size-4" />
                    <span>Create & Get Chip URL</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2Icon className="size-5" />
                <span>Card registered! Write to chip</span>
              </DialogTitle>
              <DialogDescription>
                Your card has been created in the database. Write this tracking URL to your physical
                NFC card so taps are recorded automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-1">
              {/* URL Box */}
              <div className="flex flex-col gap-1.5 rounded-xl border bg-muted/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  NFC Chip URL
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-background px-2.5 py-1.5 font-mono text-xs font-medium select-all">
                    {effectiveCardUrl}
                  </code>
                  <Button type="button" size="sm" variant="outline" onClick={copyUrl}>
                    <CopyIcon className="mr-1.5 size-3.5" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Web NFC 1-Tap Option (Chrome Android) */}
              {supportsWebNfc ? (
                <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <SmartphoneIcon className="size-4" />
                      Instant 1-Tap Web NFC
                    </span>
                    {nfcSuccess && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        <CheckCircle2Icon className="size-3.5" /> Written!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your phone browser supports direct NFC writing. Click below and touch your card
                    to the back of your phone.
                  </p>
                  <Button
                    type="button"
                    onClick={handleWriteWebNfc}
                    disabled={writingNfc}
                    className="w-full gap-2"
                  >
                    {writingNfc ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        <span>Hold card to back of phone...</span>
                      </>
                    ) : (
                      <>
                        <NfcIcon className="size-4" />
                        <span>Tap phone to write card</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : null}

              {/* Step by step manual guide */}
              <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3">
                <span className="text-xs font-semibold text-foreground">
                  How to write with NFC Tools / TagWriter:
                </span>
                <ol className="list-inside list-decimal space-y-1.5 text-xs text-muted-foreground">
                  <li>
                    Open <strong>NFC Tools</strong> (or any NFC tag writer app) on your phone.
                  </li>
                  <li>
                    Go to <strong>Write</strong> &rarr; <strong>Add a record</strong> &rarr;{" "}
                    <strong>URL / URI</strong>.
                  </li>
                  <li>
                    Paste the <strong>NFC Chip URL</strong> above and tap <strong>Write</strong>.
                  </li>
                  <li>Hold your physical card to the phone until you see the success checkmark.</li>
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)} className="w-full">
                Done & View in My Cards
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
