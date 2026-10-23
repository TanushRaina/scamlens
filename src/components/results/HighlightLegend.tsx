/**
 * Section 2 companion — the highlight legend.
 *
 * One button per category that actually appears in the message. Clicking one
 * scrolls the first occurrence of that category into view in the highlighted
 * text above.
 */

import { CATEGORY_LABEL, CATEGORY_COLOR } from '../../engine/types';
import type { Highlight } from '../../engine/types';
import { firstHighlightStart, presentCategories } from './highlights';
import { scrollToElement } from './scroll';

interface HighlightLegendProps {
  highlights: readonly Highlight[];
}

export function HighlightLegend({ highlights }: HighlightLegendProps): JSX.Element | null {
  const categories = presentCategories(highlights);
  if (categories.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category}>
          <button
            type="button"
            id={`scamlens-legend-${category}`}
            onClick={() => {
              const start = firstHighlightStart(highlights, category);
              if (start !== null) scrollToElement(`scamlens-hl-${start}`);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: CATEGORY_COLOR[category] }}
            />
            {CATEGORY_LABEL[category]}
          </button>
        </li>
      ))}
    </ul>
  );
}
