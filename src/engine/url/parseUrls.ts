/**
 * URL extraction from arbitrary text.
 *
 * Two things matter here:
 *   1. we must catch URLs written without a scheme ("bit.ly/xyz", "paypal.com")
 *      and obfuscated ones ("hxxps://paypal.com", "paypal[.]com")
 *   2. every returned offset must point into the ORIGINAL text, so the UI can
 *      highlight the exact characters.
 *
 * Obfuscation folding changes the length of the text ("[.]" is 3 chars, "." is
 * one), so we build a folded scan string together with an index map — the same
 * technique used by normalize.ts.
 */

const ZERO_WIDTH = new Set([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x180e, 0x2061]);

/**
 * Optional scheme + domain + optional port + optional path.
 * The TLD must be at least two letters, which keeps "Rs. 500" and "e.g." out.
 */
const URL_RE =
  /(?:(?:https?|ftp):\/\/)?(?:(?:[a-z0-9\u00a1-\uffff](?:[a-z0-9\u00a1-\uffff-]{0,61}[a-z0-9\u00a1-\uffff])?\.)+[a-z\u00a1-\uffff-]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?(?:\/[^\s<>"')\]]*)?/gi;

export interface ExtractedUrl {
  /** The URL exactly as it appears in the original text. */
  raw: string;
  /** Obfuscation-folded, scheme-prefixed form used for analysis. */
  normalized: string;
  /** Range in the ORIGINAL text. */
  start: number;
  end: number;
}

interface ScanText {
  text: string;
  map: number[];
}

function buildScanText(text: string): ScanText {
  const out: string[] = [];
  const map: number[] = [];
  const lower = text.toLowerCase();
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    const code = ch.codePointAt(0) as number;

    if (ZERO_WIDTH.has(code)) {
      i += 1;
      continue;
    }

    if (lower.startsWith('hxxps://', i)) {
      for (let k = 0; k < 8; k += 1) {
        out.push('https://'[k] ?? '');
        map.push(i);
      }
      i += 8;
      continue;
    }
    if (lower.startsWith('hxxp://', i)) {
      for (let k = 0; k < 7; k += 1) {
        out.push('http://'[k] ?? '');
        map.push(i);
      }
      i += 7;
      continue;
    }
    if (ch === '[' && text[i + 1] === '.' && text[i + 2] === ']') {
      out.push('.');
      map.push(i);
      i += 3;
      continue;
    }

    out.push(ch);
    map.push(i);
    i += 1;
  }

  return { text: out.join(''), map };
}

/** Trim trailing sentence punctuation from a candidate URL. */
function trimTrailing(raw: string): { text: string; trimmed: number } {
  const TRAILING = /[.,;:!?'")\]>]+$/;
  let trimmed = 0;
  let current = raw;
  const m = TRAILING.exec(raw);
  if (m && m.index > 0) {
    trimmed = raw.length - m.index;
    current = raw.slice(0, m.index);
  }
  return { text: current, trimmed };
}

/** Extract every URL-looking substring from `text`. */
export function extractUrls(text: string): ExtractedUrl[] {
  const scan = buildScanText(text);
  const results: ExtractedUrl[] = [];
  const seen = new Set<string>();

  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null = URL_RE.exec(scan.text);

  while (m) {
    let matchText = m[0];
    const matchStart = m.index;
    let matchEnd = matchStart + matchText.length;

    // "http://paypal.com@evil.xyz" — the browser ignores everything before the
    // "@", so the whole authority has to be captured, not just "paypal.com".
    if (scan.text[matchEnd] === '@') {
      while (matchEnd < scan.text.length && !/[\s<>"')\]]/.test(scan.text[matchEnd] as string)) {
        matchEnd += 1;
      }
      matchText = scan.text.slice(matchStart, matchEnd);
    }

    // Reject matches with no ASCII alphanumeric at all: Devanagari and other
    // Indic text can otherwise look like "word.word".
    if (!/[a-z0-9]/i.test(matchText)) {
      URL_RE.lastIndex = matchEnd;
      m = URL_RE.exec(scan.text);
      continue;
    }

    // Skip email local parts: "user@example.com" -> the domain is not a link.
    const prevChar = matchStart > 0 ? scan.text[matchStart - 1] : '';
    if (prevChar === '@') {
      URL_RE.lastIndex = matchEnd;
      m = URL_RE.exec(scan.text);
      continue;
    }

    const { text: trimmedText, trimmed } = trimTrailing(matchText);
    if (trimmedText.length < 6) {
      URL_RE.lastIndex = matchEnd;
      m = URL_RE.exec(scan.text);
      continue;
    }

    const origStart = scan.map[matchStart] as number;
    const origEnd = (scan.map[matchEnd - trimmed - 1] as number) + 1;
    const raw = text.slice(origStart, origEnd);
    const normalized = trimmedText.startsWith('//') ? `http://${trimmedText.slice(2)}` : trimmedText;

    const key = `${raw}|${normalized}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ raw, normalized, start: origStart, end: origEnd });
    }

    URL_RE.lastIndex = matchEnd;
    m = URL_RE.exec(scan.text);
  }

  return results;
}

/** True when the entire input is a single URL. */
export function isWholeInputUrl(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;

  const urls = extractUrls(trimmed);
  if (urls.length !== 1) return false;

  const only = urls[0];
  // The URL must start at the very beginning and cover most of the input.
  const lead = trimmed.slice(0, only.start).trim();
  const trail = trimmed.slice(only.end).trim();
  const covered = trimmed.length - lead.length - trail.length;
  return only.start <= 1 && only.end >= trimmed.length - 1 && covered / trimmed.length >= 0.8;
}
