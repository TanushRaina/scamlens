/**
 * Section 1 — the risk score gauge.
 *
 * A plain SVG arc with the numeric score in the middle. The stroke colour comes
 * from the verdict band so the gauge, the badge and the summary agree.
 */

import type { Verdict } from '../../engine/types';
import { VERDICT_STYLE } from '../../theme';

interface ScoreGaugeProps {
  score: number;
  verdict: Verdict;
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score, verdict }: ScoreGaugeProps): JSX.Element {
  const style = VERDICT_STYLE[verdict];
  const fraction = Math.max(0, Math.min(100, score)) / 100;
  const dash = fraction * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <svg
        viewBox="0 0 180 180"
        role="img"
        aria-label={`Risk score ${score} out of 100, which is ${style.label}`}
        className="h-40 w-40 shrink-0"
      >
        <circle
          cx="90"
          cy="90"
          r={RADIUS}
          fill="none"
          strokeWidth="14"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx="90"
          cy="90"
          r={RADIUS}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          stroke={style.color}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          transform="rotate(-90 90 90)"
        />
        <text
          x="90"
          y="88"
          textAnchor="middle"
          className="fill-slate-900 text-4xl font-bold dark:fill-slate-100"
        >
          {score}
        </text>
        <text x="90" y="110" textAnchor="middle" className="fill-slate-500 text-xs dark:fill-slate-400">
          / 100
        </text>
      </svg>

      <div className="min-w-0">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Score band {style.band} out of 100.</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
          {style.summary}
        </p>
      </div>
    </div>
  );
}
