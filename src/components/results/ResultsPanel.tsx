/**
 * The results panel: the ten numbered sections, always in the same order so a
 * reader can compare two analyses side by side.
 */

import type { RefObject } from 'react';
import type { AnalysisResult } from '../../engine/types';
import { ENGINE_VERSION } from '../../engine/analyze';
import { CATEGORIES } from '../../engine/types';
import type { Category } from '../../engine/types';
import { ResultSection } from './ResultSection';
import { ScoreGauge } from './ScoreGauge';
import { HighlightedText } from './HighlightedText';
import { HighlightLegend } from './HighlightLegend';
import { ExplanationCards } from './ExplanationCards';
import { ComboAlerts } from './ComboAlerts';
import { UrlTable } from './UrlTable';
import { ShowTheMath } from './ShowTheMath';
import { ActionChecklist } from './ActionChecklist';
import { TricksUsed } from './TricksUsed';
import { CategoryBar } from './CategoryBar';
import { SaveButtons } from './SaveButtons';

interface ResultsPanelProps {
  result: AnalysisResult;
  /** The wrapper element that Download captures as a PNG. */
  panel: RefObject<HTMLDivElement>;
  onSaved: (id: string) => void;
}

export function ResultsPanel({ result, panel, onSaved }: ResultsPanelProps): JSX.Element {
  const categoryScores = result.categoryScores as Readonly<Record<Category, number>>;
  const allCategories = CATEGORIES as readonly Category[];

  return (
    <div
      ref={panel}
      className="space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analysis result</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {result.inputType === 'url' ? 'URL input' : 'Message'}
        </span>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          Engine v{result.engineVersion || ENGINE_VERSION} · {allCategories.length} categories considered
        </span>
      </header>

      <div className="space-y-8">
        <ResultSection
          index={1}
          id="result-score"
          title="Risk score"
          description="A 0–100 estimate of how closely this message matches known fraud patterns."
        >
          <ScoreGauge score={result.score} verdict={result.verdict} />
        </ResultSection>

        <ResultSection
          index={2}
          id="result-highlights"
          title="Where the signals are"
          description="Each highlighted phrase is the exact evidence behind a warning."
        >
          <HighlightedText text={result.inputText} highlights={result.highlights} />
          <HighlightLegend highlights={result.highlights} />
        </ResultSection>

        <ResultSection
          index={3}
          id="result-explanations"
          title="Every warning, explained"
          description="No verdict is shown without the reasoning behind it."
        >
          <ExplanationCards findings={result.findings} />
        </ResultSection>

        <ResultSection
          index={4}
          id="result-combos"
          title="Combinations that raised the score"
          description="Signals that are harmless alone but telling together."
        >
          <ComboAlerts combos={result.combos} />
        </ResultSection>

        <ResultSection
          index={5}
          id="result-urls"
          title="Links found"
          description="Structural checks only — ScamLens never visits these addresses."
        >
          <UrlTable urls={result.urls} />
        </ResultSection>

        <ResultSection
          index={6}
          id="result-math"
          title="Show the math"
          description="Every term that fed into the score above."
        >
          <ShowTheMath terms={result.scoreTerms} score={result.score} verdict={result.verdict} />
        </ResultSection>

        <ResultSection
          index={7}
          id="result-actions"
          title="What to do now"
          description="Tick the steps as you take them."
        >
          <ActionChecklist actions={result.actions} />
        </ResultSection>

        <ResultSection
          index={8}
          id="result-tricks"
          title="Tricks used"
          description="The techniques this message relies on."
        >
          <TricksUsed tricks={result.tricks} />
        </ResultSection>

        <ResultSection
          index={9}
          id="result-categories"
          title="Risk by category"
          description="How the total score is spread across the nine risk categories."
        >
          <CategoryBar scores={categoryScores} />
        </ResultSection>

        <ResultSection
          index={10}
          id="result-save"
          title="Keep this analysis"
          description="Everything below stays on this device."
        >
          <SaveButtons result={result} panel={panel} onSaved={onSaved} />
        </ResultSection>
      </div>
    </div>
  );
}
