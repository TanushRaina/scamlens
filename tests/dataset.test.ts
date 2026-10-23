/**
 * Dataset accuracy evaluation.
 *
 * This is the gate the whole engine is built against:
 *   - overall accuracy must be >= 85%
 *   - no legitimate bank/OTP/transaction alert may be rated High or Critical
 *
 * The report is printed so the numbers can be pasted into the README.
 */

import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import type { AnalysisResult } from '../src/engine/types';
import { DATASET } from '../src/data/dataset';

/** A message is "flagged as a scam" when it reaches the High band. */
const SCAM_THRESHOLD = 60;

interface Scored {
  id: string;
  text: string;
  label: 'scam' | 'legitimate';
  kind?: string;
  score: number;
  verdict: AnalysisResult['verdict'];
  predicted: boolean;
  ruleIds: string[];
}

const scored: Scored[] = DATASET.map((message) => {
  const result = analyze(message.text, { now: 0, id: message.id });
  return {
    id: message.id,
    text: message.text,
    label: message.label,
    kind: message.kind,
    score: result.score,
    verdict: result.verdict,
    predicted: result.score >= SCAM_THRESHOLD,
    ruleIds: result.findings.map((f) => f.ruleId),
  };
});

function metrics(threshold: number) {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;

  for (const row of scored) {
    const predicted = row.score >= threshold;
    if (row.label === 'scam' && predicted) truePositives += 1;
    else if (row.label === 'scam' && !predicted) falseNegatives += 1;
    else if (row.label === 'legitimate' && predicted) falsePositives += 1;
    else trueNegatives += 1;
  }

  const accuracy = (truePositives + trueNegatives) / scored.length;
  const precision =
    truePositives + falsePositives === 0 ? 0 : truePositives / (truePositives + falsePositives);
  const recall = truePositives + falseNegatives === 0 ? 0 : truePositives / (truePositives + falseNegatives);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return { accuracy, precision, recall, f1, truePositives, falsePositives, falseNegatives, trueNegatives };
}

const atThreshold = metrics(SCAM_THRESHOLD);
const atMedium = metrics(30);

function report(): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('================ ScamLens dataset evaluation ================');
  lines.push(
    `Messages: ${DATASET.length}  (${DATASET.filter((m) => m.label === 'scam').length} scam / ${DATASET.filter((m) => m.label === 'legitimate').length} legitimate)`,
  );
  lines.push('');
  lines.push(`Decision threshold: score >= ${SCAM_THRESHOLD} (High band)`);
  lines.push(`  accuracy  ${(atThreshold.accuracy * 100).toFixed(1)}%`);
  lines.push(`  precision ${(atThreshold.precision * 100).toFixed(1)}%`);
  lines.push(`  recall    ${(atThreshold.recall * 100).toFixed(1)}%`);
  lines.push(`  F1        ${(atThreshold.f1 * 100).toFixed(1)}%`);
  lines.push(
    `  TP ${atThreshold.truePositives}  FP ${atThreshold.falsePositives}  FN ${atThreshold.falseNegatives}  TN ${atThreshold.trueNegatives}`,
  );
  lines.push('');
  lines.push(`Same metrics at the Medium threshold (score >= 30):`);
  lines.push(
    `  accuracy ${(atMedium.accuracy * 100).toFixed(1)}%  precision ${(atMedium.precision * 100).toFixed(1)}%  recall ${(atMedium.recall * 100).toFixed(1)}%  F1 ${(atMedium.f1 * 100).toFixed(1)}%`,
  );
  lines.push('');
  lines.push('Confusion matrix (threshold ' + SCAM_THRESHOLD + '):');
  lines.push('                       predicted scam   predicted safe');
  lines.push(
    `  actual scam              ${atThreshold.truePositives}                 ${atThreshold.falseNegatives}`,
  );
  lines.push(
    `  actual legitimate        ${atThreshold.falsePositives}                 ${atThreshold.trueNegatives}`,
  );
  lines.push('');

  const missed = scored.filter((r) => r.label === 'scam' && !r.predicted);
  if (missed.length > 0) {
    lines.push('Scams below the threshold (false negatives):');
    for (const row of missed) {
      lines.push(`  ${row.id}  score ${row.score}  [${row.ruleIds.join(', ')}]`);
      lines.push(`      ${row.text.slice(0, 96)}`);
    }
    lines.push('');
  }

  const overFlagged = scored.filter((r) => r.label === 'legitimate' && r.predicted);
  if (overFlagged.length > 0) {
    lines.push('Legitimate messages above the threshold (false positives):');
    for (const row of overFlagged) {
      lines.push(`  ${row.id}  score ${row.score}  [${row.ruleIds.join(', ')}]`);
      lines.push(`      ${row.text.slice(0, 96)}`);
    }
    lines.push('');
  }

  lines.push('==============================================================');
  return lines.join('\n');
}

describe('dataset evaluation', () => {
  it('prints the full report', () => {
    // eslint-disable-next-line no-console
    console.log(report());
    expect(scored.length).toBeGreaterThan(0);
  });

  it('has at least 80 messages with 45+ scams and 35+ legitimate', () => {
    expect(DATASET.length).toBeGreaterThanOrEqual(80);
    expect(DATASET.filter((m) => m.label === 'scam').length).toBeGreaterThanOrEqual(45);
    expect(DATASET.filter((m) => m.label === 'legitimate').length).toBeGreaterThanOrEqual(35);
  });

  it('reaches 85% accuracy at the High threshold', () => {
    expect(atThreshold.accuracy).toBeGreaterThanOrEqual(0.85);
  });

  it('never rates a legitimate bank/OTP/transaction alert High or Critical', () => {
    const alerts = scored.filter((r) => r.kind === 'bank_otp' || r.kind === 'transaction');
    expect(alerts.length).toBeGreaterThan(0);

    const bad = alerts.filter((r) => r.score >= 60);
    const detail = bad.map((r) => `${r.id} (${r.score}) [${r.ruleIds.join(', ')}]`);
    expect(detail).toEqual([]);
  });

  it('rates the majority of scams High or Critical', () => {
    const caught = scored.filter((r) => r.label === 'scam' && r.score >= 60).length;
    expect(caught / scored.filter((r) => r.label === 'scam').length).toBeGreaterThanOrEqual(0.8);
  });
});
