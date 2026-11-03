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
  officePhone: string | null;
  companyWebsite: string | null;
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
  const office = profile.officePhone ? toInternationalDigits(profile.officePhone) : null;
  if (office) lines.push(`TEL;TYPE=WORK,VOICE:+${office}`);
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeText(profile.email)}`);
  if (profile.website) lines.push(`URL:${profile.website}`);
  if (profile.companyWebsite) lines.push(`URL;TYPE=WORK:${profile.companyWebsite}`);
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

export type ContactVCardData = {
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
};

export function buildContactVCard(contact: ContactVCardData): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const name = escapeText(contact.name);

  lines.push(`N:;${name};;;`, `FN:${name}`);
  if (contact.company) lines.push(`ORG:${escapeText(contact.company)}`);
  if (contact.jobTitle) lines.push(`TITLE:${escapeText(contact.jobTitle)}`);

  const phone = contact.phone ? toInternationalDigits(contact.phone) : null;
  if (phone) lines.push(`TEL;TYPE=CELL:+${phone}`);
  if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeText(contact.email)}`);
  if (contact.website) lines.push(`URL:${contact.website}`);
  if (contact.address) lines.push(`ADR;TYPE=WORK:;;${escapeText(contact.address)};;;;`);
  if (contact.notes) lines.push(`NOTE:${escapeText(contact.notes)}`);
  lines.push("END:VCARD");

  return lines.map(foldLine).join(CRLF) + CRLF;
}
