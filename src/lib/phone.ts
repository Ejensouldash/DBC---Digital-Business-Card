const MY_COUNTRY_CODE = "60";

// Normalises a phone number to international digits, assuming Malaysia for local
// numbers: "012-345 6789" → "60123456789", "+65 9123 4567" → "6591234567".
export function toInternationalDigits(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;

  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(MY_COUNTRY_CODE)) return digits;
  if (digits.startsWith("0")) return MY_COUNTRY_CODE + digits.slice(1);
  return MY_COUNTRY_CODE + digits;
}

export function telHref(input: string): string | null {
  const digits = toInternationalDigits(input);
  return digits ? `tel:+${digits}` : null;
}

export function whatsAppHref(input: string): string | null {
  const digits = toInternationalDigits(input);
  return digits ? `https://wa.me/${digits}` : null;
}
