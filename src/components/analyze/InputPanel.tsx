/**
 * The input half of the Analyze page: the textarea, the toolbar (Analyze /
 * Clear / Try a sample) and the one-click sample list.
 */

import { useState } from 'react';
import { SAMPLES } from '../../data/samples';
import { MAX_INPUT_LENGTH } from '../../engine/normalize';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onTrySample: (text: string) => void;
  /** True when an analysis is currently displayed. */
  hasResult: boolean;
}

export function InputPanel({
  value,
  onChange,
  onAnalyze,
  onClear,
  onTrySample,
  hasResult,
}: InputPanelProps): JSX.Element {
  const [samplesOpen, setSamplesOpen] = useState<boolean>(false);

  const remaining = MAX_INPUT_LENGTH - value.length;
  const tooLong = remaining < 0;

  return (
    <section
      aria-labelledby="input-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <h2 id="input-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Paste a message, email, SMS or URL
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Paste the text you are worried about. It is analysed on this device only — nothing is uploaded.
      </p>

      <label htmlFor="scamlens-input" className="sr-only">
        Message to analyse
      </label>
      <textarea
        id="scamlens-input"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_INPUT_LENGTH))}
        rows={9}
        placeholder="Example: Your account will be blocked. Share your OTP to verify."
        className="scamlens-scroll mt-4 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      <div className="mt-2 flex items-center justify-between text-xs" aria-live="polite">
        <span className={tooLong ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}>
          {value.length.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()} characters
        </span>
        <span>Longer text is truncated to {MAX_INPUT_LENGTH.toLocaleString()} characters.</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={value.trim().length === 0}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={value.length === 0 && !hasResult}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setSamplesOpen((open) => !open)}
          aria-expanded={samplesOpen}
          aria-controls="scamlens-samples"
          className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500"
        >
          Try a sample
        </button>
      </div>

      {samplesOpen ? (
        <div
          id="scamlens-samples"
          role="group"
          aria-label="Sample messages"
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {SAMPLES.length} demo messages, including legitimate ones
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {SAMPLES.map((sample) => (
              <li key={sample.id}>
                <button
                  type="button"
                  onClick={() => {
                    onTrySample(sample.text);
                    setSamplesOpen(false);
                  }}
                  title={sample.note}
                  className="flex w-full items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      sample.expected === 'low'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : sample.expected === 'critical'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {sample.expected}
                  </span>
                  <span className="text-slate-800 dark:text-slate-100">{sample.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
