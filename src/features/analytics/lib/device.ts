import type { DeviceType } from "@/lib/db/schema";

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|headless|lighthouse/i;

// Link previews (WhatsApp, Telegram, Slack...) fetch the page too; they are not taps.
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function detectDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return "unknown";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return "mobile";
  if (/windows|macintosh|linux|cros/i.test(userAgent)) return "desktop";
  return "unknown";
}
