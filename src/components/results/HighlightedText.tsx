/**
 * Section 2 — the message with its evidence highlighted.
 *
 * The text is rendered as an array of plain React strings. Nothing is ever
 * passed through `dangerouslySetInnerHTML`, so pasted content cannot become
 * markup. Each highlighted run is a focusable element that scrolls its legend
 * entry into view, and the legend scrolls highlights into view in return.
 */

import { segmentsForRender } from '../../engine/highlight';
import { CATEGORY_LABEL } from '../../engine/types';
import type { Category, Highlight } from '../../engine/types';
import { highlightFill } from './highlights';
import { scrollToElement } from './scroll';

interface HighlightedTextProps {
  text: string;
  highlights: readonly Highlight[];
}

export function HighlightedText({ text, highlights }: HighlightedTextProps): JSX.Element {
  const segments = segmentsForRender(text, highlights);

  let cursor = 0;

  return (
    <div>
      <div
        role="region"
        aria-label="Message text with highlighted evidence"
        className="scamlens-scroll max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      >
        <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
          {segments.map((segment, index) => {
            const start = cursor;
            cursor += segment.text.length;

            if (!segment.highlighted || !segment.category) {
              return <span key={index}>{segment.text}</span>;
            }

            const category = segment.category as Category;

            return (
              <mark
                key={index}
                id={`scamlens-hl-${start}`}
                data-category={category}
                tabIndex={0}
                title={`${CATEGORY_LABEL[category]}${segment.ruleId ? ` · ${segment.ruleId}` : ''}`}
                onFocus={() => scrollToLegend(category)}
                onClick={() => scrollToLegend(category)}
                className="cursor-pointer rounded px-0.5 font-semibold outline-none ring-1 ring-inset focus-visible:ring-2 focus-visible:ring-indigo-500"
                style={{ backgroundColor: highlightFill(category) }}
              >
                {segment.text}
              </mark>
            );
          })}
        </p>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Hover or focus a highlighted phrase to find it in the legend; click a legend entry to jump to its
        first occurrence.
      </p>
    </div>
  );
}

/** Scroll the matching legend entry into view. */
function scrollToLegend(category: Category): void {
  scrollToElement(`scamlens-legend-${category}`);
}
