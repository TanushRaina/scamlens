/**
 * Section 3 — one card per triggered rule.
 *
 * Every warning is explained in plain language, what a legitimate sender would
 * have done instead, and (when the rule offers one) a direct instruction. A
 * downgraded finding says so, so the reader can see why the score is lower than
 * the raw evidence suggests.
 */

import { CATEGORY_LABEL, CATEGORY_COLOR } from '../../engine/types';
import type { Finding } from '../../engine/types';
import { formatWeight } from '../../theme';

interface ExplanationCardsProps {
  findings: readonly Finding[];
}

export function ExplanationCards({ findings }: ExplanationCardsProps): JSX.Element {
  if (findings.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        No individual signals were triggered.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {findings.map((finding) => (
        <li
          key={finding.ruleId}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                color: CATEGORY_COLOR[finding.category],
                backgroundColor: `${CATEGORY_COLOR[finding.category]}1a`,
              }}
            >
              {CATEGORY_LABEL[finding.category]}
            </span>
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {finding.label}
            </span>
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              weight {formatWeight(finding.weight)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {finding.explanation}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              A legitimate sender would:{' '}
            </span>
            {finding.legitimateBehavior}
          </p>

          {finding.advice ? (
            <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200">
              {finding.advice}
            </p>
          ) : null}

          {finding.mitigated ? (
            <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              Downgraded: {finding.mitigationReason ?? 'a safety phrase was found nearby.'}
            </p>
          ) : null}

          {finding.matches.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Evidence in this message
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {finding.matches.map((match, index) => (
                  <li
                    key={`${finding.ruleId}-${index}`}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {match.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
