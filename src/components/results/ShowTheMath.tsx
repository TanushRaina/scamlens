/**
 * Section 6 — "Show the math".
 *
 * The score is not a black box: every term that fed into it is listed with its
 * weight and a note naming what it came from. Mitigations appear as negative
 * contributions so a reduction is visible rather than mysterious.
 */

import type { ScoreTerm, Verdict } from '../../engine/types';
import { VERDICT_STYLE, formatTermWeight } from '../../theme';

interface ShowTheMathProps {
  terms: readonly ScoreTerm[];
  score: number;
  verdict: Verdict;
}

export function ShowTheMath({ terms, score, verdict }: ShowTheMathProps): JSX.Element {
  const style = VERDICT_STYLE[verdict];

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Each signal contributes independently and is combined with a <em>noisy-OR</em>, so several weak
        signals add up without any single one dominating. The final score is capped at 100.
      </p>

      <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
        {terms.map((term, index) => (
          <li
            key={`${term.source}-${index}`}
            className="flex flex-wrap items-baseline gap-2 px-4 py-2.5 text-sm"
          >
            <span
              className={`w-24 shrink-0 font-medium ${
                term.weight < 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {term.kind === 'mitigation'
                ? 'reduced'
                : term.kind === 'combination'
                  ? 'combo'
                  : term.kind === 'baseline'
                    ? 'base'
                    : 'signal'}
            </span>
            <span className="flex-1 text-slate-600 dark:text-slate-300">{term.note}</span>
            <span className="w-20 shrink-0 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {formatTermWeight(term.weight)}
            </span>
          </li>
        ))}
      </ol>

      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: style.color }}>
        Final score
        <span className="font-mono text-lg tabular-nums">{score}</span>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          / 100 · {VERDICT_STYLE[verdict].label}
        </span>
      </p>
    </div>
  );
}
