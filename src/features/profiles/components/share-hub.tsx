"use client";

import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  Share2Icon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { toast } from "sonner";

import { normalizeProfileUrl, useClientOrigin } from "@/lib/client-origin";

import { QrCode } from "@/components/shared/qr-code";

import { shareProfile } from "./profile-share-actions";

type ShareHubProps = {
  displayName: string;
  jobTitle: string | null;
  company: string | null;
  avatarUrl: string | null;
  slug: string;
  profileUrl: string;
  isPublished: boolean;
};

type Action = { key: string; label: string; Icon: LucideIcon } & (
  { onClick: () => void } | { href: string }
);

const ACTION =
  "flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-xs text-slate-600 outline-none transition hover:bg-slate-100 hover:text-teal-700 focus-visible:ring-3 focus-visible:ring-ring/60";

// The owner's card as a shareable object: name, big QR, URL and one-tap share actions.
export function ShareHub(props: ShareHubProps) {
  const { displayName, jobTitle, company, avatarUrl, slug, profileUrl, isPublished } = props;
  const t = useTranslations("Dashboard.share");
  const tProfile = useTranslations("Profile");
  const origin = useClientOrigin();
  const effectiveProfileUrl = normalizeProfileUrl(profileUrl, origin);

  const qrUrl = `${effectiveProfileUrl}?src=qr`;
  const subtitle = [jobTitle, company].filter(Boolean).join(" · ");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(effectiveProfileUrl);
      toast.success(tProfile("linkCopied"));
    } catch {
      toast.error(tProfile("copyFailed"));
    }
  }

  async function downloadQr() {
    try {
      const href = await QRCode.toDataURL(qrUrl, { width: 1024, margin: 2 });
      Object.assign(document.createElement("a"), { href, download: `${slug}-qr.png` }).click();
    } catch {
      toast.error(t("qrFailed"));
    }
  }

  const actions: Action[] = [
    { key: "copy", label: t("copy"), Icon: CopyIcon, onClick: copyLink },
    { key: "qr", label: t("downloadQr"), Icon: DownloadIcon, onClick: downloadQr },
    {
      key: "whatsapp",
      label: t("whatsapp"),
      Icon: MessageCircleIcon,
      href: `https://wa.me/?text=${encodeURIComponent(`${displayName}: ${effectiveProfileUrl}`)}`,
    },
    {
      key: "share",
      label: t("share"),
      Icon: Share2Icon,
      onClick: () =>
        shareProfile(displayName, effectiveProfileUrl, {
          copied: tProfile("linkCopied"),
          failed: tProfile("copyFailed"),
        }),
    },
    { key: "open", label: t("open"), Icon: ExternalLinkIcon, href: effectiveProfileUrl },
  ];

  return (
    <section
      aria-labelledby="share-hub-title"
      className="relative overflow-hidden rounded-3xl glass p-5 sm:p-6"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgb(0_168_182/0.08),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgb(140_198_63/0.08),transparent_60%)]"
      />
      <div className="flex items-center gap-3">
        <div className="size-12 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small, already resized
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0">
          <h2 id="share-hub-title" className="truncate text-lg font-semibold">
            {displayName}
          </h2>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="rounded-3xl bg-white p-3 shadow-md border border-slate-200/80">
          <QrCode value={qrUrl} size={200} label={t("qrLabel", { name: displayName })} />
        </div>
        <p className="max-w-full truncate font-mono text-sm text-muted-foreground">
          {effectiveProfileUrl.replace(/^https?:\/\//, "")}
        </p>
        {isPublished ? null : (
          <p className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
            {t("draft")}
          </p>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-5 gap-1">
        {actions.map((action) => (
          <li key={action.key}>
            {"href" in action ? (
              <a href={action.href} target="_blank" rel="noopener noreferrer" className={ACTION}>
                <action.Icon className="size-5 text-teal-600" aria-hidden />
                {action.label}
              </a>
            ) : (
              <button type="button" onClick={action.onClick} className={`${ACTION} w-full`}>
                <action.Icon className="size-5 text-teal-600" aria-hidden />
                {action.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
