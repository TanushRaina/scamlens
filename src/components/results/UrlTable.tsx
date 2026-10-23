/**
 * Section 5 — the URL table.
 *
 * Every link found in the message is listed with its host, structural score and
 * verdict. The individual checks are collapsed per row so the table stays
 * readable while the reasoning stays available.
 */

import type { UrlAnalysis } from '../../engine/types';
import { formatWeight } from '../../theme';

interface UrlTableProps {
  urls: readonly UrlAnalysis[];
}

const SEVERITY_CLASS: Record<string, string> = {
  info: 'text-slate-500 dark:text-slate-400',
  low: 'text-sky-700 dark:text-sky-300',
  medium: 'text-amber-700 dark:text-amber-300',
  high: 'text-red-700 dark:text-red-300',
};

export function UrlTable({ urls }: UrlTableProps): JSX.Element | null {
  if (urls.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        No links were found in this message.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Links found in the message and the result of each structural check
        </caption>
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-slate-700">
            <th scope="col" className="py-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">
              Link
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">
              Host
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">
              Score
            </th>
            <th scope="col" className="py-2 font-semibold text-slate-700 dark:text-slate-300">
              Verdict
            </th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => (
            <tr key={url.normalized} className="border-b border-slate-100 align-top dark:border-slate-800">
              <td className="py-2 pr-3">
                <span
                  className="font-mono text-xs text-indigo-700 dark:text-indigo-300"
                  title={url.normalized}
                >
                  {url.normalized.length > 60 ? `${url.normalized.slice(0, 57)}…` : url.normalized}
                </span>
              </td>
              <td className="py-2 pr-3 font-mono text-xs text-slate-600 dark:text-slate-400">{url.host}</td>
              <td className="py-2 pr-3 tabular-nums text-slate-700 dark:text-slate-300">
                {Math.round(url.score * 100)}%
              </td>
              <td className="py-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    url.trusted
                      ? 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                      : url.suspicious
                        ? 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800'
                        : 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                  }`}
                >
                  {url.verdict}
                </span>
                {url.checks.length > 0 ? (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                      {url.checks.length} structural check{url.checks.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="mt-1 space-y-1">
                      {url.checks.map((check) => (
                        <li
                          key={check.id}
                          className="flex gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400"
                        >
                          <span className={SEVERITY_CLASS[check.severity] ?? SEVERITY_CLASS.info}>
                            {check.label}
                          </span>
                          <span>{check.detail}</span>
                        </li>
                      ))}
                    </ul>
                    {url.lookalikeOf && url.lookalikeOf.length > 0 ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Similar to: {url.lookalikeOf.join(', ')}
                      </p>
                    ) : null}
                  </details>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Score shown as a share of the maximum structural score ({formatWeight(1)}). Links are checked
        structurally only — ScamLens does not visit them and cannot verify a site&apos;s live reputation.
      </p>
    </div>
  );
}
