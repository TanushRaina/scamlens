/**
 * Section 8 — "N tricks used".
 *
 * A plain-language roll-up of the techniques detected in this message, so the
 * reader can recognise the same pattern elsewhere.
 */

interface TricksUsedProps {
  tricks: readonly string[];
}

export function TricksUsed({ tricks }: TricksUsedProps): JSX.Element {
  if (tricks.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        No disguise or pressure techniques were detected.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        <span className="font-mono text-lg text-indigo-600 dark:text-indigo-400">{tricks.length}</span> trick
        {tricks.length === 1 ? '' : 's'} used in this message
      </p>
      <ul className="mt-2 space-y-1.5">
        {tricks.map((trick, index) => (
          <li
            key={`${trick}-${index}`}
            className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
          >
            <span aria-hidden="true" className="text-indigo-500">
              ▸
            </span>
            <span>{trick}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
