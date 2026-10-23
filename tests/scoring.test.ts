/**
 * Scoring tests: the noisy-OR behaviour, combination boosts, mitigations,
 * category scores, verdict bands, and the ReDoS guard.
 */

import { describe, expect, it } from 'vitest';
import {
  capMatches,
  combosFor,
  computeCategoryScores,
  computeScore,
  dedupeByRule,
  noisyOr,
  verdictFor,
  MAX_MATCHES_PER_FINDING,
} from '../src/engine/scoring';
import { analyze } from '../src/engine/analyze';
import { RULES } from '../src/engine/rules';
import { CATEGORIES } from '../src/engine/types';
import type { Finding, Match } from '../src/engine/types';

function finding(partial: Partial<Finding> & { ruleId: string }): Finding {
  return {
    category: 'credential_theft',
    label: partial.label ?? partial.ruleId,
    weight: partial.weight ?? 0.5,
    matches: partial.matches ?? [],
    explanation: 'test explanation',
    legitimateBehavior: 'test behavior',
    ...partial,
  };
}

describe('noisy-OR', () => {
  it('returns 0 for no signals', () => {
    expect(noisyOr([])).toBe(0);
  });

  it('equals the single weight for one signal', () => {
    expect(noisyOr([0.5])).toBe(0.5);
  });

  it('combines independent signals without simply adding them', () => {
    expect(noisyOr([0.5, 0.5])).toBe(0.75);
    expect(noisyOr([0.3, 0.3])).toBeCloseTo(0.51, 5);
  });

  it('saturates below 1 no matter how many signals there are', () => {
    const many = Array.from({ length: 50 }, () => 0.7);
    const result = noisyOr(many);
    expect(result).toBeLessThan(1);
    expect(result).toBeGreaterThan(0.999);
    // ... and the score on a 0-100 scale stays capped at 100.
    expect(Math.round(result * 100)).toBe(100);
  });

  it('clamps out-of-range weights instead of throwing', () => {
    expect(noisyOr([2, -1])).toBeCloseTo(0.99, 5);
    expect(noisyOr([0])).toBe(0);
  });
});

describe('finding deduplication', () => {
  it('keeps only the highest-weight finding per rule id', () => {
    const merged = dedupeByRule([
      finding({ ruleId: 'a', weight: 0.2 }),
      finding({ ruleId: 'a', weight: 0.6 }),
      finding({ ruleId: 'b', weight: 0.3 }),
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.find((f) => f.ruleId === 'a')?.weight).toBe(0.6);
  });

  it('caps matches so repetition cannot dominate', () => {
    const matches: Match[] = Array.from({ length: 40 }, (_, i) => ({
      start: i * 2,
      end: i * 2 + 1,
      text: 'x',
    }));
    expect(capMatches(matches).length).toBe(MAX_MATCHES_PER_FINDING);
    expect(capMatches(matches.slice(0, 3)).length).toBe(3);
  });
});

describe('verdict bands', () => {
  it('maps scores onto the documented bands', () => {
    expect(verdictFor(0)).toBe('low');
    expect(verdictFor(29)).toBe('low');
    expect(verdictFor(30)).toBe('medium');
    expect(verdictFor(59)).toBe('medium');
    expect(verdictFor(60)).toBe('high');
    expect(verdictFor(79)).toBe('high');
    expect(verdictFor(80)).toBe('critical');
    expect(verdictFor(100)).toBe('critical');
  });
});

describe('combination boosts', () => {
  it('only fires when every category in the pair is present', () => {
    expect(combosFor([finding({ ruleId: 'a', category: 'credential_theft' })])).toEqual([]);
    const combos = combosFor([
      finding({ ruleId: 'a', category: 'credential_theft' }),
      finding({ ruleId: 'b', category: 'urgency' }),
    ]);
    expect(combos).toHaveLength(1);
    expect(combos[0]?.id).toBe('credential_plus_urgency');
    expect(combos[0]?.explanation.length).toBeGreaterThan(20);
  });

  it('ignores mitigated findings when deciding what is present', () => {
    const combos = combosFor([
      finding({ ruleId: 'a', category: 'credential_theft', mitigated: true }),
      finding({ ruleId: 'b', category: 'urgency' }),
    ]);
    expect(combos).toEqual([]);
  });

  it('reports every documented combination shape', () => {
    const all = combosFor([
      finding({ ruleId: '1', category: 'credential_theft' }),
      finding({ ruleId: '2', category: 'urgency' }),
      finding({ ruleId: '3', category: 'impersonation' }),
      finding({ ruleId: '4', category: 'suspicious_link' }),
      finding({ ruleId: '5', category: 'financial_lure' }),
      finding({ ruleId: '6', category: 'payment_redflag' }),
      finding({ ruleId: '7', category: 'contact_pattern' }),
      finding({ ruleId: '8', category: 'regional' }),
    ]);
    const ids = all.map((c) => c.id).sort();
    expect(ids).toEqual(
      [
        'contact_plus_financial',
        'contact_plus_payment',
        'credential_plus_urgency',
        'financial_lure_plus_payment',
        'impersonation_plus_credential',
        'impersonation_plus_link',
        'regional_plus_link',
      ].sort(),
    );
  });
});

describe('score computation', () => {
  it('adds combination boosts on top of the base risk', () => {
    const base = computeScore({
      findings: [finding({ ruleId: 'a', category: 'credential_theft', weight: 0.5 })],
      combos: [],
      mitigationReduction: 0,
    });
    const boosted = computeScore({
      findings: [finding({ ruleId: 'a', category: 'credential_theft', weight: 0.5 })],
      combos: [
        {
          id: 'c',
          categories: ['credential_theft', 'urgency'],
          title: 't',
          explanation: 'e',
          weight: 0.3,
        },
      ],
      mitigationReduction: 0,
    });
    expect(boosted.score).toBeGreaterThan(base.score);
  });

  it('reduces the score when a mitigation applies', () => {
    const findings = [finding({ ruleId: 'a', category: 'credential_theft', weight: 0.7 })];
    const without = computeScore({ findings, combos: [], mitigationReduction: 0 });
    const withMitigation = computeScore({ findings, combos: [], mitigationReduction: 0.3 });
    expect(withMitigation.score).toBeLessThan(without.score);
    expect(withMitigation.score).toBe(Math.round(without.risk * 0.7 * 100));
  });

  it('never returns a negative or over-100 score', () => {
    const result = computeScore({
      findings: [finding({ ruleId: 'a', weight: 0.9 })],
      combos: [],
      mitigationReduction: 1,
    });
    expect(result.score).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('produces a per-category breakdown covering every category', () => {
    const scores = computeCategoryScores(
      [
        finding({ ruleId: 'a', category: 'credential_theft', weight: 0.6 }),
        finding({ ruleId: 'b', category: 'urgency', weight: 0.4 }),
        finding({ ruleId: 'c', category: 'credential_theft', weight: 0.2, mitigated: true }),
      ],
      [],
    );
    expect(Object.keys(scores).sort()).toEqual([...CATEGORIES].sort());
    expect(scores.credential_theft).toBe(60);
    expect(scores.urgency).toBe(40);
    expect(scores.financial_lure).toBe(0);
  });

  it('keeps category scores inside 0..100', () => {
    const scores = computeCategoryScores(
      [finding({ ruleId: 'a', category: 'payment_redflag', weight: 0.8 })],
      [
        {
          id: 'c',
          categories: ['payment_redflag', 'financial_lure'],
          title: 't',
          explanation: 'e',
          weight: 0.5,
        },
      ],
    );
    for (const value of Object.values(scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(scores.payment_redflag).toBeGreaterThan(scores.financial_lure);
  });
});

describe('end-to-end scoring', () => {
  it('returns a neutral result for empty input', () => {
    const result = analyze('', { now: 0, id: 'x' });
    expect(result.insufficientInput).toBe(true);
    expect(result.score).toBe(0);
    expect(result.verdict).toBe('low');
  });

  it('scores a single decisive signal above a single weak one', () => {
    const strong = analyze('Share your OTP now', { now: 0, id: 'a' });
    const weak = analyze('Hello there friend', { now: 0, id: 'b' });
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it('does not let one repeated phrase inflate the score without bound', () => {
    const once = analyze('Share your OTP', { now: 0, id: 'a' });
    const repeated = analyze('Share your OTP '.repeat(20), { now: 0, id: 'b' });
    expect(repeated.score).toBeLessThanOrEqual(once.score + 1);
  });

  it('raises the score when an independent second signal appears', () => {
    const single = analyze('Share your OTP', { now: 0, id: 'a' });
    const pair = analyze('Your account will be blocked. Share your OTP', { now: 0, id: 'b' });
    expect(pair.score).toBeGreaterThan(single.score);
  });

  it('lowers the score when the message is a warning rather than a request', () => {
    const request = analyze('Share your OTP with us', { now: 0, id: 'a' });
    const warning = analyze('Your OTP is 482913. Do not share this OTP with anyone.', { now: 0, id: 'b' });
    expect(warning.score).toBeLessThan(request.score);
    expect(warning.mitigations.length).toBeGreaterThan(0);
  });

  it('lowers the score for an informational transaction alert', () => {
    const alert = analyze('A/c XX1234 debited Rs 500 on 22 Oct 2026 at HDFC ATM', { now: 0, id: 'a' });
    expect(alert.mitigations.some((m) => m.id === 'transaction_alert')).toBe(true);
    expect(alert.score).toBeLessThan(30);
  });
});

describe('ReDoS guard', () => {
  const adversarial = [
    'a'.repeat(5000) + '!',
    '('.repeat(4000),
    'a'.repeat(3000) + 'b'.repeat(3000),
    'A'.repeat(10000),
    'a b c d '.repeat(2000),
    '0'.repeat(5000) + 'paypal',
    '((((((((((((((((((((((((((('.repeat(500),
    '[a-zA-Z0-9]*'.repeat(1000),
  ];

  it('analyses adversarial inputs well under 200 ms each', () => {
    for (const text of adversarial) {
      const start = performance.now();
      const result = analyze(text, { now: 0, id: 'redos' });
      const elapsed = performance.now() - start;
      expect(elapsed, `input of ${text.length} chars took ${elapsed} ms`).toBeLessThan(200);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it('truncates inputs longer than the cap without slowing down', () => {
    const huge = 'x'.repeat(200_000);
    const start = performance.now();
    analyze(huge, { now: 0, id: 'huge' });
    expect(performance.now() - start).toBeLessThan(200);
  });

  it('every rule pattern is linear enough to survive a repetition bomb', () => {
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        const bomb = 'ab'.repeat(5000);
        const start = performance.now();
        pattern.lastIndex = 0;
        pattern.exec(bomb);
        const elapsed = performance.now() - start;
        expect(elapsed, `${rule.id} took ${elapsed} ms`).toBeLessThan(200);
      }
    }
  });
});
