/**
 * The Analyze page: input panel on the left, results on the right.
 *
 * The engine is called synchronously on the button press. A full analysis of a
 * 10,000-character message takes a few milliseconds, so there is no loading
 * state to get wrong — and no async gap in which the input could change.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { analyze } from '../engine/analyze';
import { MAX_INPUT_LENGTH } from '../engine/normalize';
import type { AnalysisResult } from '../engine/types';
import { InputPanel } from '../components/analyze/InputPanel';
import { ResultsPanel } from '../components/results/ResultsPanel';
import { prefersReducedMotion } from '../components/results/scroll';

const EMPTY_HINT = 'Nothing has been analysed yet. Paste a message above and press Analyze.';

export function AnalyzePage(): JSX.Element {
  const location = useLocation();
  const [text, setText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);

  // A scan reopened from History arrives as router state.
  useEffect(() => {
    const reopened = (location.state as { text?: string } | null)?.text;
    if (typeof reopened === 'string' && reopened.length > 0) {
      const next = reopened.slice(0, MAX_INPUT_LENGTH);
      setText(next);
      setResult(analyze(next));
      setError('');
    }
  }, [location.state]);

  const runAnalysis = useCallback((candidate: string): void => {
    const trimmed = candidate.trim();
    if (trimmed.length === 0) {
      setResult(null);
      setError('');
      return;
    }
    try {
      setResult(analyze(candidate.slice(0, MAX_INPUT_LENGTH)));
      setError('');
    } catch (cause) {
      setResult(null);
      setError(
        cause instanceof Error
          ? `The analyser stopped unexpectedly: ${cause.message}`
          : 'The analyser stopped unexpectedly.',
      );
    }
  }, []);

  const handleAnalyze = (): void => {
    runAnalysis(text);
    const target = document.getElementById('result-score');
    if (target) {
      target.scrollIntoView({
        block: 'start',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  };

  const handleTrySample = (sampleText: string): void => {
    setText(sampleText.slice(0, MAX_INPUT_LENGTH));
    runAnalysis(sampleText);
  };

  const handleClear = (): void => {
    setText('');
    setResult(null);
    setError('');
    setNotice('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <InputPanel
          value={text}
          onChange={setText}
          onAnalyze={handleAnalyze}
          onClear={handleClear}
          onTrySample={handleTrySample}
          hasResult={result !== null}
        />

        <div>
          {notice ? (
            <p
              role="status"
              className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
            >
              {notice}
            </p>
          ) : null}
          {result ? (
            <ResultsPanel
              result={result}
              panel={panelRef}
              onSaved={(id) => setNotice(`Saved to history as ${id.slice(0, 12)}…`)}
            />
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            >
              {error}
            </div>
          ) : (
            <div
              role="status"
              className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              {EMPTY_HINT}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
