import { toInternationalDigits } from "@/lib/phone";

export type VCardProfile = {
  displayName: string;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  profileUrl: string;
};

export type VCardLink = { type: string; url: string };

const CRLF = "\r\n";
const MAX_LINE_OCTETS = 75;

// RFC 2426 §4: backslash, comma, semicolon and newlines must be escaped in text values.
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\r|\n/g, "\\n");
}

// Folds a content line at 75 octets without splitting a multi-byte UTF-8 character.
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let octets = 0;

  for (const char of line) {
    const size = encoder.encode(char).length;
    // Continuation lines start with a space, which counts toward their 75 octets.
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

export function buildVCard(
  profile: VCardProfile,
  links: VCardLink[],
  photoJpegBase64?: string,
): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const name = escapeText(profile.displayName);

  // Malay and many other names don't split into given/family, so keep the full name as given.
  lines.push(`N:;${name};;;`, `FN:${name}`);
  if (profile.company) lines.push(`ORG:${escapeText(profile.company)}`);
  if (profile.jobTitle) lines.push(`TITLE:${escapeText(profile.jobTitle)}`);

  const phone = profile.phone ? toInternationalDigits(profile.phone) : null;
  if (phone) lines.push(`TEL;TYPE=CELL:+${phone}`);
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeText(profile.email)}`);
  if (profile.website) lines.push(`URL:${profile.website}`);
  lines.push(`URL;TYPE=PROFILE:${profile.profileUrl}`);
  for (const link of links) {
    lines.push(`X-SOCIALPROFILE;TYPE=${link.type}:${link.url}`);
  }
  if (profile.address) lines.push(`ADR;TYPE=WORK:;;${escapeText(profile.address)};;;;`);
  if (profile.bio) lines.push(`NOTE:${escapeText(profile.bio)}`);
  if (photoJpegBase64) lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoJpegBase64}`);
  lines.push("END:VCARD");

  return lines.map(foldLine).join(CRLF) + CRLF;
}
