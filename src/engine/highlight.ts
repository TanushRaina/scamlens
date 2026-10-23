/**
 * Highlight range computation.
 *
 * Findings produce overlapping character ranges (a phrase can be both an OTP
 * request and an impersonation claim). Overlaps are merged, keeping the
 * higher-weight category, and the result is sorted so the UI can render the
 * original text as an array of plain strings — never as HTML.
 */

import type { Category, Highlight } from './types';

/**
 * Priority used when two categories claim the same characters. Credential
 * theft outranks everything because it is the one that actually loses money
 * right now; language quality never outranks anything.
 */
export const CATEGORY_PRIORITY: Record<Category, number> = {
  credential_theft: 9,
  suspicious_link: 8,
  payment_redflag: 7,
  impersonation: 6,
  urgency: 5,
  financial_lure: 4,
  regional: 3,
  contact_pattern: 2,
  language_quality: 1,
};

interface RawRange {
  start: number;
  end: number;
  category: Category;
  ruleId: string;
  weight: number;
}

/**
 * Merge overlapping ranges, keeping the higher-priority category.
 */
export function mergeRanges(ranges: readonly RawRange[]): Highlight[] {
  const sorted = [...ranges].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return b.end - a.end;
    const pa = CATEGORY_PRIORITY[a.category];
    const pb = CATEGORY_PRIORITY[b.category];
    if (pa !== pb) return pb - pa;
    return b.weight - a.weight;
  });

  const merged: Highlight[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start < last.end) {
      // Overlap: keep the higher-priority label, extend the span.
      const lastPriority = CATEGORY_PRIORITY[last.category];
      const thisPriority = CATEGORY_PRIORITY[range.category];
      if (thisPriority > lastPriority) {
        last.category = range.category;
        last.ruleId = range.ruleId;
      }
      if (range.end > last.end) last.end = range.end;
    } else if (last && range.start === last.end) {
      // Adjacent, not overlapping: merge anyway so the UI renders one span.
      const lastPriority = CATEGORY_PRIORITY[last.category];
      const thisPriority = CATEGORY_PRIORITY[range.category];
      if (thisPriority >= lastPriority) {
        last.category = range.category;
        last.ruleId = range.ruleId;
      }
      last.end = range.end;
    } else {
      merged.push({
        start: range.start,
        end: range.end,
        category: range.category,
        ruleId: range.ruleId,
      });
    }
  }

  return merged;
}

/**
 * Convert findings into merged highlight ranges on the original text.
 */
export function buildHighlights(
  findings: readonly {
    category: Category;
    ruleId: string;
    weight: number;
    matches: readonly { start: number; end: number }[];
  }[],
): Highlight[] {
  const raw: RawRange[] = [];
  for (const finding of findings) {
    for (const match of finding.matches) {
      if (match.end <= match.start) continue;
      raw.push({
        start: match.start,
        end: match.end,
        category: finding.category,
        ruleId: finding.ruleId,
        weight: finding.weight,
      });
    }
  }
  return mergeRanges(raw);
}

export interface TextSegment {
  text: string;
  highlighted: boolean;
  category?: Category;
  ruleId?: string;
}

/**
 * Split the original text into plain-text segments for safe React rendering.
 * The UI renders these as React children — never as HTML — so no user input
 * ever reaches the DOM as markup.
 */
export function segmentsForRender(text: string, highlights: readonly Highlight[]): TextSegment[] {
  if (highlights.length === 0) return [{ text, highlighted: false }];

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const highlight of highlights) {
    if (highlight.start > cursor) {
      segments.push({ text: text.slice(cursor, highlight.start), highlighted: false });
    }
    segments.push({
      text: text.slice(highlight.start, highlight.end),
      highlighted: true,
      category: highlight.category,
      ruleId: highlight.ruleId,
    });
    cursor = highlight.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }
  return segments;
}
