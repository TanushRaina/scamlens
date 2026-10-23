/**
 * Section 7 — the action checklist.
 *
 * Interactive: ticking items is a local UI state, nothing is saved. It turns the
 * advice into something the reader can actually act on.
 */

import { useState } from 'react';

interface ActionChecklistProps {
  actions: readonly string[];
}

export function ActionChecklist({ actions }: ActionChecklistProps): JSX.Element {
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set<number>());

  if (actions.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        No specific actions were generated for this message.
      </p>
    );
  }

  const remaining = actions.length - done.size;

  const toggle = (index: number): void => {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div>
      <ul className="space-y-2">
        {actions.map((action, index) => {
          const isDone = done.has(index);
          return (
            <li key={`${action}-${index}`}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed transition-colors ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900/70 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200/60'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(index)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <span className={isDone ? 'line-through' : undefined}>{action}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {remaining} of {actions.length} action{actions.length === 1 ? '' : 's'} remaining.
      </p>
    </div>
  );
}
