/**
 * The History page.
 *
 * Lists everything saved on this device, newest first. Phase 3 adds search,
 * verdict filtering, statistics and import/export; this page covers the parts
 * the "Save to history" button already depends on: read, reopen, delete, clear.
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearScans,
  emptyState,
  isStorageAvailable,
  loadState,
  removeScan,
  saveState,
  type HistoryState,
} from '../storage/historyStore';
import type { Verdict } from '../engine/types';
import { VERDICT_ORDER, VERDICT_STYLE, formatTimestamp } from '../theme';

export function HistoryPage(): JSX.Element {
  const navigate = useNavigate();
  const [state, setState] = useState<HistoryState>(() => {
    const loaded = loadState();
    return loaded.ok ? loaded.value : emptyState();
  });
  const [storageWarning, setStorageWarning] = useState<string>('');

  const reload = useCallback((): void => {
    const loaded = loadState();
    if (loaded.ok) {
      setState(loaded.value);
      setStorageWarning('');
    } else {
      setStorageWarning(loaded.reason);
    }
  }, []);

  const handleDelete = (id: string): void => {
    const loaded = loadState();
    if (!loaded.ok) return;
    const next = removeScan(loaded.value, id);
    saveState(next);
    setState(next);
  };

  const handleClear = (): void => {
    const loaded = loadState();
    if (!loaded.ok) return;
    const next = clearScans(loaded.value);
    saveState(next);
    setState(next);
  };

  const ordered = [...state.scans].sort((a, b) => {
    const order = VERDICT_ORDER.indexOf(a.verdict as Verdict);
    const other = VERDICT_ORDER.indexOf(b.verdict as Verdict);
    if (order !== other) return order - other;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">History</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {state.scans.length} saved on this device. Newest first within each risk band.
        </p>
        {state.scans.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            Clear all
          </button>
        ) : null}
      </header>

      {storageWarning ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {storageWarning}
        </p>
      ) : null}

      {!isStorageAvailable() ? (
        <p
          role="status"
          className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
        >
          Your browser has storage disabled, so history only lasts for this session.
        </p>
      ) : null}

      {ordered.length === 0 ? (
        <div
          role="status"
          className="mt-6 flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"
        >
          <span aria-hidden="true" className="text-4xl">
            🗂️
          </span>
          <p className="mt-3 font-medium text-slate-800 dark:text-slate-100">No scans saved yet</p>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Analyse a message and press <strong>Save to history</strong>. Everything stays on this device.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Go to Analyze
          </button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {ordered.map((scan) => {
            const style = VERDICT_STYLE[scan.verdict as Verdict];
            const preview = scan.inputText.replace(/\s+/g, ' ').slice(0, 140);
            return (
              <li
                key={scan.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
                  >
                    {style.label}
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {scan.score}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </span>
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    {formatTimestamp(scan.createdAt)}
                  </span>
                </div>

                <p className="mt-2 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {preview}
                  {scan.inputText.length > 140 ? '…' : ''}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/', { state: { text: scan.inputText } })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Reopen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(scan.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={reload}
        className="mt-6 text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
      >
        Reload history
      </button>
    </div>
  );
}
