/**
 * Text normalization + obfuscation handling.
 *
 * The single hard requirement of this module: every match offset produced
 * against a normalized layer must be re-mappable to the ORIGINAL text, so the
 * UI can highlight the exact characters the user pasted.
 *
 * We therefore never call `String.prototype.normalize('NFKC')` on a whole
 * string (it can change length and destroys offsets). Instead we fold
 * characters one at a time while recording an index map:
 *
 *   map[i] === index in `original` that produced layer character i
 *
 * A match [s, e) in a layer becomes [map[s], map[e - 1] + 1) in the original.
 *
 * Assumption: targeted per-character folding covers the practical homoglyph /
 * fullwidth / ligature / math-alphanumeric cases that actually appear in
 * phishing text. Full NFKC equivalence is deliberately not attempted because
 * it is not offset-preserving.
 */

import type { Match } from './types';

/** Hard cap on analysed input length. Guards against ReDoS-shaped payloads. */
export const MAX_INPUT_LENGTH = 10_000;

export type ObfuscationKind =
  'zero_width' | 'homoglyph' | 'fullwidth' | 'ligature' | 'leet' | 'spaced_letters' | 'repeated_chars';

export interface Obfuscation {
  kind: ObfuscationKind;
  detail: string;
  /** Range in the ORIGINAL text. */
  start: number;
  end: number;
  sample: string;
}

/** A normalized matching layer plus the map back into the original text. */
export interface Layer {
  text: string;
  map: number[];
}

export interface NormalizeResult {
  original: string;
  /** Main keyword-matching layer: folded homoglyphs, leet A, collapsed spaced runs. */
  deobfuscated: Layer;
  /** Second leet variant (digit 1 folded to "l" rather than "i"). */
  deobfuscatedAlt: Layer;
  /** deobfuscated with consecutive repeated characters collapsed. */
  compressed: Layer;
  obfuscations: Obfuscation[];
}

const ZERO_WIDTH = new Set([
  0x200b, // zero width space
  0x200c, // zero width non-joiner
  0x200d, // zero width joiner
  0x2060, // word joiner
  0x2061, // function application
  0x2062, // invisible times
  0x2063, // invisible separator
  0x2064, // invisible plus
  0xfeff, // zero width no-break space / BOM
  0x180e, // mongolian vowel separator
]);

const LIGATURES: Record<string, string> = {
  ﬁ: 'fi',
  ﬂ: 'fl',
  ﬃ: 'ffi',
  ﬄ: 'ffl',
  ﬅ: 'st',
  ﬆ: 'st',
};

/** Cyrillic look-alikes → Latin. */
const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'z',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'h',
  о: 'o',
  п: 'p',
  р: 'p',
  с: 'c',
  т: 't',
  у: 'y',
  ф: 'f',
  х: 'x',
  ц: 'c',
  ч: 'c',
  ш: 's',
  щ: 's',
  э: 'e',
  ю: 'u',
  я: 'y',
  А: 'A',
  Б: 'B',
  В: 'B',
  Г: 'G',
  Д: 'D',
  Е: 'E',
  Ё: 'E',
  З: 'Z',
  И: 'I',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'H',
  О: 'O',
  П: 'P',
  Р: 'P',
  С: 'C',
  Т: 'T',
  У: 'Y',
  Ф: 'F',
  Х: 'X',
  Ц: 'C',
  Ч: 'C',
  Ш: 'S',
  Щ: 'S',
  Э: 'E',
  Ю: 'U',
  Я: 'Y',
};

/** Greek look-alikes → Latin. */
const GREEK: Record<string, string> = {
  α: 'a',
  β: 'b',
  γ: 'g',
  δ: 'd',
  ε: 'e',
  ζ: 'z',
  η: 'h',
  θ: '8',
  ι: 'i',
  κ: 'k',
  λ: 'l',
  μ: 'm',
  ν: 'n',
  ξ: 'x',
  ο: 'o',
  π: 'p',
  ρ: 'p',
  σ: 's',
  ς: 's',
  τ: 't',
  υ: 'u',
  φ: 'f',
  χ: 'x',
  ψ: 'p',
  ω: 'w',
  Α: 'A',
  Β: 'B',
  Γ: 'G',
  Δ: 'D',
  Ε: 'E',
  Ζ: 'Z',
  Η: 'H',
  Θ: '8',
  Ι: 'I',
  Κ: 'K',
  Λ: 'L',
  Μ: 'M',
  Ν: 'N',
  Ξ: 'X',
  Ο: 'O',
  Π: 'P',
  Ρ: 'P',
  Σ: 'S',
  Τ: 'T',
  Υ: 'Y',
  Φ: 'F',
  Χ: 'X',
  Ψ: 'P',
  Ω: 'W',
};

/** Unicode "letter-like symbol" look-alikes. */
const SYMBOL_LETTERS: Record<string, string> = {
  K: 'K',
  Å: 'A',
  ℭ: 'C',
  ℯ: 'e',
  ℴ: 'o',
  ℷ: 'y',
  ℸ: 'x',
  ⅅ: 'F',
  ⅆ: 'd',
  ⅇ: 'e',
  ⅈ: 'h',
  ⅉ: 'i',
  '⅊': 'l',
  '⅋': 'r',
  '⅌': 'b',
  '⅍': 'b',
  ⅎ: 'v',
  '⅏': 'y',
};

/** Leet folding variant A: digits map to their most common letter. */
const LEET_A: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '6': 'g',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '@': 'a',
  $: 's',
};

/** Leet folding variant B: "1" maps to "l" so "paypa1" folds to "paypal". */
const LEET_B: Record<string, string> = { ...LEET_A, '1': 'l' };

const LEET_CHARS = '03456789@$';

const FULLWIDTH_RE = /^[＀-￮]$/;

/**
 * Fold one character to its Latin-equivalent form.
 * Returns one or more characters (ligatures expand).
 */
function foldChar(ch: string): string {
  const code = ch.codePointAt(0) as number;

  // Fullwidth forms (U+FF01..U+FF5E) and ideographic space.
  if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0);
  if (code === 0x3000) return ' ';

  // Mathematical alphanumeric symbols (straight ASCII block only).
  if (code >= 0x1d400 && code <= 0x1d419) return String.fromCharCode(65 + (code - 0x1d400));
  if (code >= 0x1d41a && code <= 0x1d433) return String.fromCharCode(97 + (code - 0x1d41a));
  if (code >= 0x1d434 && code <= 0x1d449) return String.fromCharCode(65 + (code - 0x1d434));
  if (code >= 0x1d44a && code <= 0x1d463) return String.fromCharCode(97 + (code - 0x1d44a));
  if (code >= 0x1d464 && code <= 0x1d479) return String.fromCharCode(65 + (code - 0x1d464));
  if (code >= 0x1d47a && code <= 0x1d48d) return String.fromCharCode(97 + (code - 0x1d47a));

  if (LIGATURES[ch]) return LIGATURES[ch];
  if (CYRILLIC[ch]) return CYRILLIC[ch];
  if (GREEK[ch]) return GREEK[ch];
  if (SYMBOL_LETTERS[ch]) return SYMBOL_LETTERS[ch];

  return ch;
}

function isZeroWidth(ch: string): boolean {
  return ZERO_WIDTH.has(ch.codePointAt(0) as number);
}

function isSpace(ch: string): boolean {
  const code = ch.codePointAt(0) as number;
  return (
    code === 0x20 ||
    code === 0x09 ||
    code === 0x0a ||
    code === 0x0d ||
    code === 0xa0 ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a) ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x3000
  );
}

function isLatinAlpha(ch: string): boolean {
  return /^[a-z]$/i.test(ch);
}

/**
 * Substitute leet characters (digits, @, $) with their letter equivalents.
 *
 * Two guards keep this from destroying real text:
 *  - the character must sit next to a letter ("p4yp4l" yes, "6 digit" no);
 *  - it must not sit inside a run of digits, so a masked account reference such
 *    as "A/c XX1234" is preserved for the mitigation checks.
 */
function foldLeet(chars: readonly string[], table: Record<string, string>): string[] {
  return chars.map((c, i) => {
    const replacement = table[c];
    if (replacement === undefined || replacement === c) return c;
    const prev = i > 0 ? chars[i - 1] : '';
    const next = i + 1 < chars.length ? chars[i + 1] : '';
    const besideLetter = /[a-z]/.test(prev) || /[a-z]/.test(next);
    const insideDigitRun = /[0-9]/.test(prev) || /[0-9]/.test(next);
    return besideLetter && !insideDigitRun ? replacement : c;
  });
}

/**
 * Convert a range in a layer back into a range in the original text.
 * `map` must have one entry per layer character.
 */
export function layerToOriginal(layer: Layer, start: number, end: number): Match {
  const safeStart = Math.max(0, Math.min(start, layer.map.length - 1));
  const safeEnd = Math.max(safeStart + 1, Math.min(end, layer.map.length));
  return {
    start: layer.map[safeStart] as number,
    end: (layer.map[safeEnd - 1] as number) + 1,
    text: '',
  };
}

/**
 * Normalize a message into matching layers and report every obfuscation
 * technique that was detected.
 */
export function normalize(raw: string): NormalizeResult {
  const original = raw.slice(0, MAX_INPUT_LENGTH);
  const obfuscations: Obfuscation[] = [];

  // ---- Pass 1: fold characters, drop zero-width -------------------------
  const chars: string[] = [];
  const origIdx: number[] = [];
  let sawHomoglyph = false;
  let sawFullwidth = false;
  let sawLigature = false;

  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];

    if (isZeroWidth(ch)) {
      obfuscations.push({
        kind: 'zero_width',
        detail: 'Invisible (zero-width) characters were inserted into the text.',
        start: i,
        end: i + 1,
        sample: ch,
      });
      continue;
    }

    const folded = foldChar(ch);
    if (FULLWIDTH_RE.test(ch)) sawFullwidth = true;
    if (LIGATURES[ch]) sawLigature = true;
    if (CYRILLIC[ch] || GREEK[ch] || SYMBOL_LETTERS[ch]) sawHomoglyph = true;
    if (codePointInMathAlpha(ch)) sawHomoglyph = true;

    for (let k = 0; k < folded.length; k += 1) {
      chars.push(folded[k] as string);
      origIdx.push(i);
    }
  }

  // ---- Pass 2: collapse spaced-out letters ("P a y p a l" -> "Paypal") ---
  const spaced = collapseSpacedLetters(chars, origIdx, original, obfuscations);

  // ---- Pass 3: build the three keyword layers ----------------------------
  const lower = spaced.chars.map((c) => c.toLowerCase());
  const map = spaced.origIdx;

  // Leet substitution in both variants, but only when the digit sits next to a
  // letter. Folding "6" inside "6 digit OTP" would destroy the digit-shaped
  // rules that legitimately match "6 digit code"; folding the "4" inside
  // "p4yp4l" is exactly what we want.
  const leetA = foldLeet(lower, LEET_A);
  const leetB = foldLeet(lower, LEET_B);
  const mapAlt = map;

  const compressed = collapseRepeats(lower);

  if (sawHomoglyph) {
    obfuscations.push({
      kind: 'homoglyph',
      detail:
        'Characters from a different alphabet (Cyrillic/Greek/symbol) were used to imitate Latin letters.',
      start: 0,
      end: original.length,
      sample: original.slice(0, 60),
    });
  }
  if (sawFullwidth) {
    obfuscations.push({
      kind: 'fullwidth',
      detail: 'Full-width characters were used to imitate ordinary keyboard letters.',
      start: 0,
      end: original.length,
      sample: original.slice(0, 60),
    });
  }
  if (sawLigature) {
    obfuscations.push({
      kind: 'ligature',
      detail: 'Ligature characters were used to disguise part of a word.',
      start: 0,
      end: original.length,
      sample: original.slice(0, 60),
    });
  }

  // ---- Pass 4: leet + repeated-char detection on the RAW text ------------
  detectLeet(original, obfuscations);
  detectRepeats(original, obfuscations);

  // Sort by position so the obfuscation finding renders deterministically.
  obfuscations.sort((a, b) => a.start - b.start);

  return {
    original,
    deobfuscated: { text: leetA.join(''), map },
    deobfuscatedAlt: { text: leetB.join(''), map: mapAlt },
    compressed: { text: compressed.text, map: compressed.map },
    obfuscations,
  };
}

function codePointInMathAlpha(ch: string): boolean {
  const code = ch.codePointAt(0) as number;
  return (
    (code >= 0x1d400 && code <= 0x1d419) ||
    (code >= 0x1d41a && code <= 0x1d433) ||
    (code >= 0x1d434 && code <= 0x1d449) ||
    (code >= 0x1d44a && code <= 0x1d463) ||
    (code >= 0x1d464 && code <= 0x1d479) ||
    (code >= 0x1d47a && code <= 0x1d48d)
  );
}

interface SpacedRun {
  chars: string[];
  origIdx: number[];
}

/**
 * Collapse runs of single letters separated by whitespace into one word.
 * Returns the rebuilt char array plus the (possibly shortened) index array.
 */
function collapseSpacedLetters(
  chars: string[],
  origIdx: number[],
  original: string,
  obfuscations: Obfuscation[],
): SpacedRun {
  const out: string[] = [];
  const map: number[] = [];
  const n = chars.length;

  let i = 0;
  while (i < n) {
    // A spaced run starts with a lone letter followed by whitespace.
    if (isLatinAlpha(chars[i]) && i + 2 < n && isSpace(chars[i + 1]) && isLatinAlpha(chars[i + 2])) {
      const letters: number[] = [i];
      let k = i + 2;
      while (k < n && isLatinAlpha(chars[k]) && k + 1 < n && isSpace(chars[k + 1])) {
        letters.push(k);
        k += 2;
      }

      if (letters.length >= 4) {
        const first = letters[0] as number;
        const last = letters[letters.length - 1] as number;
        obfuscations.push({
          kind: 'spaced_letters',
          detail: 'Letters of a word were deliberately spread out with spaces.',
          start: origIdx[first] as number,
          end: (origIdx[last] as number) + 1,
          sample: original.slice(origIdx[first] as number, (origIdx[last] as number) + 1),
        });
        for (const idx of letters) {
          out.push(chars[idx] as string);
          map.push(origIdx[idx] as number);
        }
        i = k;
        continue;
      }
    }
    out.push(chars[i]);
    map.push(origIdx[i] as number);
    i += 1;
  }

  return { chars: out, origIdx: map };
}

/** Collapse runs of identical adjacent characters (e.g. "ppppaypal"). */
function collapseRepeats(layer: string[]): { text: string; map: number[] } {
  const map: number[] = [];
  let out = '';
  for (let i = 0; i < layer.length; i += 1) {
    if (i > 0 && layer[i] === layer[i - 1]) continue;
    out += layer[i];
    map.push(i);
  }
  return { text: out, map };
}

/** Detect leet-style substitution of digits/symbols inside words. */
function detectLeet(original: string, obfuscations: Obfuscation[]): void {
  const re = new RegExp(`[A-Za-z][${LEET_CHARS}][A-Za-z]+|[A-Za-z]{2,}[${LEET_CHARS}](?![0-9])`, 'g');
  let m: RegExpExecArray | null = re.exec(original);
  let first = -1;
  let count = 0;
  while (m) {
    if (first < 0) first = m.index;
    count += 1;
    if (count > 5) break; // we only need to report the tactic once
    m = re.exec(original);
  }
  if (first >= 0) {
    obfuscations.push({
      kind: 'leet',
      detail: 'Letters were replaced with look-alike digits or symbols (leetspeek).',
      start: first,
      end: first + 8,
      sample: original.slice(first, first + 8),
    });
  }
}

/** Detect long runs of repeated letters, a cheap obfuscation trick. */
function detectRepeats(original: string, obfuscations: Obfuscation[]): void {
  const re = /([A-Za-z])\1{3,}/g;
  let m: RegExpExecArray | null = re.exec(original);
  let found = false;
  while (m && !found) {
    const at = m.index;
    const len = (m[0] ?? '').length;
    if (len >= 4) {
      obfuscations.push({
        kind: 'repeated_chars',
        detail: 'A word was padded with repeated letters to stretch a recognisable name.',
        start: at,
        end: at + len,
        sample: original.slice(at, at + len),
      });
      found = true;
    }
    m = re.exec(original);
  }
}
