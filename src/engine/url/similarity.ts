/**
 * String-similarity helpers used for look-alike domain detection.
 *
 * Two normalizations are applied before comparing:
 *   1. structural — drop the scheme, port, leading "www." and trailing "/"
 *   2. substitution — fold leet digits into letters and drop digits, so
 *      "paypa1", "paypal0" and "paypal" all collapse together.
 */

const LETTER_FOLD: Record<string, string> = {
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

/** Iterative Levenshtein distance with a two-row buffer. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] as number) + 1,
        (curr[j - 1] as number) + 1,
        (prev[j - 1] as number) + cost,
      );
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length] as number;
}

/** Remove the scheme / port / path / "www." from a URL-ish string. */
export function structuralNormalize(raw: string): string {
  let s = raw.trim().toLowerCase();
  const scheme = /^[a-z][a-z0-9+.-]*:\/\//.exec(s);
  if (scheme) s = s.slice(scheme[0].length);
  s = s.replace(/\/.*$/, '');
  s = s.replace(/:\d+$/, '');
  s = s.replace(/^www\./, '');
  s = s.replace(/\.$/, '');
  return s;
}

/** Fold leet digits and drop digits / non-letters. */
export function foldForLookalike(raw: string): string {
  return raw
    .toLowerCase()
    .split('')
    .map((ch) => LETTER_FOLD[ch] ?? ch)
    .filter((ch) => /^[a-z]$/.test(ch))
    .join('');
}

/**
 * Decide whether a host looks like a misspelling of a brand name.
 *
 * Returns the distance and the brand spelling that matched so the UI can
 * show "this looks like paypal.com".
 */
export function closestBrandDistance(
  host: string,
  brandNames: ReadonlySet<string>,
): { name: string; distance: number } | null {
  const structural = structuralNormalize(host);
  const folded = foldForLookalike(structural);
  const firstLabel = structural.split('.')[0] ?? '';
  const firstLabelFolded = foldForLookalike(firstLabel);

  let best: { name: string; distance: number } | null = null;

  for (const brand of brandNames) {
    const brandFolded = foldForLookalike(brand);
    if (brandFolded.length < 4) continue; // too short to judge safely

    const distances = [levenshtein(folded, brandFolded), levenshtein(firstLabelFolded, brandFolded)];

    // Also allow a brand name embedded in a longer label, e.g. "paypal-help".
    if (firstLabelFolded.length > brandFolded.length + 2) {
      distances.push(levenshtein(firstLabelFolded.slice(0, brandFolded.length + 2), brandFolded));
    }

    const distance = Math.min(...distances);
    if (best === null || distance < best.distance) {
      best = { name: brand, distance };
    }
  }

  return best;
}

/**
 * True when the distance is small enough to be a deliberate misspelling.
 * Brand names under 5 letters only allow a single substitution — otherwise
 * short names would produce too many false positives.
 */
export function isLookalike(
  host: string,
  brandNames: ReadonlySet<string>,
): { lookalike: boolean; name: string; distance: number } {
  const best = closestBrandDistance(host, brandNames);
  if (!best) return { lookalike: false, name: '', distance: 0 };

  const brandFolded = foldForLookalike(best.name);
  const threshold = brandFolded.length >= 5 ? 2 : 1;

  return {
    // A distance of zero means the names are identical, which is the opposite
    // of a look-alike.
    lookalike: best.distance > 0 && best.distance <= threshold,
    name: best.name,
    distance: best.distance,
  };
}
