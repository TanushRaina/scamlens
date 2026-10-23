/**
 * PII masking applied before a scan is written to localStorage.
 *
 * Masking is LENGTH PRESERVING on purpose: every character that is hidden is
 * replaced by a single "*", so character offsets recorded by the engine stay
 * valid and the highlights in a reopened scan still point at the right place.
 */

export const MASK_CHAR = '*';

/** Mask the local part of an e-mail, keeping the domain readable. */
const EMAIL_RE = /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

/** Mask the local part of a UPI handle, keeping the @handle visible. */
const UPI_RE = /\b([A-Za-z0-9._-]{2,})@([a-z]{2,})\b/g;

/** Indian PAN: five letters, four digits, one letter. */
const PAN_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

/** Card number written in groups of four. */
const CARD_RE = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;

/** Aadhaar-style 12-digit number. */
const AADHAAR_RE = /\b\d{12}\b/g;

/** Indian mobile number, optionally with country code. */
const PHONE_RE = /(?<!\d)(?:\+?\d{1,3}[ -]?)?(\d{10})(?!\d)/g;

function stars(length: number): string {
  return MASK_CHAR.repeat(Math.max(0, length));
}

/** Mask a digit run, leaving any leading separator characters untouched. */
function maskDigits(match: string): string {
  return match.replace(/\d/g, MASK_CHAR);
}

/**
 * Mask personal data in a message.
 *
 * Returns the masked text; it is always the same length as the input.
 */
export function maskPersonalData(input: string): string {
  let out = input;

  // E-mail and UPI first: both contain "@", and a UPI handle would otherwise be
  // partially eaten by the generic digit rules.
  out = out.replace(EMAIL_RE, (_m, local: string, domain: string) => `${stars(local.length)}@${domain}`);
  out = out.replace(UPI_RE, (_m, local: string, handle: string) => `${stars(local.length)}@${handle}`);

  // PAN before the digit rules, so its digits are not masked twice.
  out = out.replace(PAN_RE, (m) => stars(m.length));

  // Longest digit runs first, so a 16-digit card is not caught as an Aadhaar.
  out = out.replace(CARD_RE, maskDigits);
  out = out.replace(AADHAAR_RE, maskDigits);
  out = out.replace(PHONE_RE, (m, digits: string) => m.replace(digits, stars(digits.length)));

  return out;
}

/** True when masking changed the text. */
export function hasPersonalData(input: string): boolean {
  return maskPersonalData(input) !== input;
}
