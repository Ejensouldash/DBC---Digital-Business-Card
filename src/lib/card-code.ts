import { z } from "zod";

// No 0/O, 1/I/L: codes are read and typed by humans when a chip fails.
export const CARD_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CARD_CODE_LENGTH = 8;

const CARD_CODE_PATTERN = new RegExp(`^[${CARD_CODE_ALPHABET}]{${CARD_CODE_LENGTH}}$`);

export const cardCodeSchema = z.string().trim().toUpperCase().regex(CARD_CODE_PATTERN);

// Largest multiple of the alphabet size below 256, so every symbol is equally likely.
const UNBIASED_LIMIT = 256 - (256 % CARD_CODE_ALPHABET.length);

type RandomFill = (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;

export function generateCardCode(
  fill: RandomFill = (bytes) => crypto.getRandomValues(bytes),
): string {
  let code = "";
  while (code.length < CARD_CODE_LENGTH) {
    for (const byte of fill(new Uint8Array(CARD_CODE_LENGTH * 2))) {
      if (byte >= UNBIASED_LIMIT) continue;
      code += CARD_CODE_ALPHABET[byte % CARD_CODE_ALPHABET.length];
      if (code.length === CARD_CODE_LENGTH) break;
    }
  }
  return code;
}

export function cardUrl(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/$/, "")}/c/${code}`;
}
