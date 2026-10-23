/**
 * Section 10 — save, copy and download.
 *
 *   Save    → masked copy goes into local history (`scamlens:v1`).
 *   Copy    → the analysis JSON goes to the clipboard.
 *   Download → a PNG snapshot of the results panel, falling back to JSON.
 *
 * None of these make a network request.
 */

import { useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';
import type { AnalysisResult } from '../../engine/types';
import { addScan, loadState, prepareScan, saveState } from '../../storage/historyStore';

interface SaveButtonsProps {
  result: AnalysisResult;
  panel: RefObject<HTMLElement>;
  /** Called after a successful save so the page can confirm it. */
  onSaved: (message: string) => void;
}

export function SaveButtons({ result, panel, onSaved }: SaveButtonsProps): JSX.Element {
  const [status, setStatus] = useState<string>('');

  const flash = (message: string): void => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 4000);
  };

  const handleSave = (): void => {
    const loaded = loadState();
    if (!loaded.ok) {
      flash(`Could not save: ${loaded.reason}`);
      return;
    }
    const settings = loaded.value.settings;
    const stored = prepareScan(result, settings);
    const next = addScan(loaded.value, stored);
    const saved = saveState(next);
    if (saved.ok) {
      flash(settings.maskPersonalData ? 'Saved (personal data masked).' : 'Saved to history.');
      onSaved(stored.id);
    } else {
      flash(`Could not save: ${saved.reason}`);
    }
  };

  const handleCopy = async (): Promise<void> => {
    const payload = JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      flash('Analysis JSON copied to clipboard.');
    } catch {
      if (copyFallback(payload)) {
        flash('Analysis JSON copied to clipboard.');
      } else {
        flash('Copy failed — your browser blocked the clipboard.');
      }
    }
  };

  const handleDownload = async (): Promise<void> => {
    const node = panel.current;
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { cacheBust: true });
      downloadDataUrl(dataUrl, `scamlens-${result.id}.png`);
      flash('Saved a PNG snapshot of this analysis.');
    } catch {
      const payload = JSON.stringify(result, null, 2);
      downloadDataUrl(
        `data:application/json;charset=utf-8,${encodeURIComponent(payload)}`,
        `scamlens-${result.id}.json`,
      );
      flash('Image capture failed — downloaded the JSON instead.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Save to history
      </button>
      <button
        type="button"
        onClick={() => {
          void handleCopy();
        }}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Copy JSON
      </button>
      <button
        type="button"
        onClick={() => {
          void handleDownload();
        }}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Download
      </button>
      {status ? (
        <span role="status" className="text-sm text-slate-600 dark:text-slate-300">
          {status}
        </span>
      ) : null}
    </div>
  );
}

/** Clipboard fallback for browsers that block `navigator.clipboard`. */
function copyFallback(text: string): boolean {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok =
      document.execCommand('copy') ||
      (document as unknown as { execCommand?: (cmd: string) => boolean }).execCommand?.('copy');
    document.body.removeChild(area);
    return Boolean(ok);
  } catch {
    return false;
  }
}

/** Trigger a browser download from a data URL. */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
