/**
 * Helpers shared by the highlighted text and its legend.
 */

import { CATEGORIES, CATEGORY_COLOR } from '../../engine/types';
import type { Category, Highlight } from '../../engine/types';

/** Categories present in a result, in the engine's stable display order. */
export function presentCategories(highlights: readonly Highlight[]): Category[] {
  const present = new Set(highlights.map((h) => h.category));
  return CATEGORIES.filter((category) => present.has(category));
}

/** Start offset of the first highlight belonging to a category. */
export function firstHighlightStart(highlights: readonly Highlight[], category: Category): number | null {
  for (const highlight of highlights) {
    if (highlight.category === category) return highlight.start;
  }
  return null;
}

/** Convert a `#rrggbb` hex string to an `rgba()` string with the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Translucent background for a highlighted run, so the wording stays readable. */
export function highlightFill(category: Category): string {
  return withAlpha(CATEGORY_COLOR[category], 0.32);
}
