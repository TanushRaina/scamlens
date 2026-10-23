/**
 * Every one-click sample must land in the verdict band it claims.
 *
 * This is the UI-facing counterpart of the dataset accuracy gate: the sample
 * dropdown is the first thing a visitor tries, so its promises have to hold.
 */

import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { SAMPLES, type SampleExpectation } from '../src/data/samples';

const BAND_MIN: Record<SampleExpectation, number> = {
  low: 0,
  medium: 30,
  high: 60,
  critical: 80,
};

const BAND_MAX: Record<SampleExpectation, number> = {
  low: 29,
  medium: 59,
  high: 79,
  critical: 100,
};

describe('demo samples', () => {
  it('offers at least eight samples and at least one legitimate one', () => {
    expect(SAMPLES.length).toBeGreaterThanOrEqual(8);
    expect(SAMPLES.some((sample) => sample.expected === 'low')).toBe(true);
  });

  it.each(SAMPLES.map((sample) => [sample.id, sample] as const))(
    '%s lands in its declared band',
    (_id, sample) => {
      const result = analyze(sample.text, { now: 0, id: sample.id });
      expect(result.score, sample.note).toBeGreaterThanOrEqual(BAND_MIN[sample.expected]);
      expect(result.score, sample.note).toBeLessThanOrEqual(BAND_MAX[sample.expected]);
      expect(result.verdict, sample.note).toBe(sample.expected);
    },
  );

  it('explains every sample in plain language', () => {
    for (const sample of SAMPLES) {
      expect(sample.note.length).toBeGreaterThan(10);
      expect(sample.title.length).toBeGreaterThan(3);
      expect(sample.text.length).toBeGreaterThan(20);
    }
  });

  it('legitimate samples stay out of the high bands', () => {
    const legitimate = SAMPLES.filter((sample) => sample.expected === 'low');
    expect(legitimate.length).toBeGreaterThan(0);
    for (const sample of legitimate) {
      const result = analyze(sample.text, { now: 0, id: sample.id });
      expect(result.score).toBeLessThan(60);
    }
  });
});
