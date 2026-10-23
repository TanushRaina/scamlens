/**
 * The numbered wrapper around each section of the results panel.
 *
 * Sections are numbered 1..10 in the order the spec requires, so the reader can
 * see at a glance that nothing is missing.
 */

import type { ReactNode } from 'react';

interface ResultSectionProps {
  /** 1-based position in the results panel. */
  index: number;
  /** Stable id, also used as the anchor target. */
  id: string;
  title: string;
  /** Optional one-line description shown under the heading. */
  description?: string;
  children: ReactNode;
}

export function ResultSection({ index, id, title, description, children }: ResultSectionProps): JSX.Element {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <h3
        id={headingId}
        className="flex items-center gap-3 text-base font-semibold text-slate-900 dark:text-slate-100"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
        >
          {index}
        </span>
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
