/**
 * Section 4 — combination alerts.
 *
 * A single phrase is often ambiguous; two or three together are much less so.
 * Each alert names the categories that combined and what that combination
 * usually means.
 */

import type { ComboBoost } from '../../engine/types';
import { formatWeight } from '../../theme';

interface ComboAlertsProps {
  combos: readonly ComboBoost[];
}

export function ComboAlerts({ combos }: ComboAlertsProps): JSX.Element | null {
  if (combos.length === 0) return null;

  return (
    <ul className="space-y-2">
      {combos.map((combo) => (
        <li
          key={combo.id}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
        >
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            <span aria-hidden="true">⚡</span>
            {combo.title}
            <span className="ml-auto rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              +{formatWeight(combo.weight)}
            </span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">
            {combo.explanation}
          </p>
        </li>
      ))}
    </ul>
  );
}
