/**
 * Scoring.
 *
 * The score is NOT a sum of points. It is a noisy-OR over independent
 * signals, which means:
 *
 *   - a single decisive signal can carry almost all of the risk,
 *   - repeating the same signal does not keep adding risk,
 *   - adding a genuinely different signal pushes the score up a lot when the
 *     base risk is still low, and a little when it is already near 1.
 *
 * Combination boosts are added as extra noisy-OR terms on top, and
 * mitigations multiply the result downwards.
 */

import type { Category, ComboBoost, Finding, Match, Verdict } from './types';
import { CATEGORIES } from './types';
import { evaluateCombinations } from './combinations';

/** Number of matches retained per finding (repetition must not dominate). */
export const MAX_MATCHES_PER_FINDING = 8;

/** Keeps noisy-OR strictly below 1 even under floating-point rounding. */
export const NOISY_OR_EPSILON = 1e-12;

/**
 * Noisy-OR: 1 - PRODUCT(1 - w_i).
 * Returns 0 for an empty input and saturates below 1 by construction.
 */
export function noisyOr(weights: readonly number[]): number {
  let product = 1;
  for (const w of weights) {
    const clamped = Math.max(0, Math.min(0.99, w));
    product *= 1 - clamped;
  }
  // Floating point can make 1 - product collapse to exactly 1 for very many
  // signals; keep the mathematical invariant that risk is always < 1.
  return Math.min(1 - NOISY_OR_EPSILON, 1 - product);
}

/** Keep only the highest-weight finding per rule id. */
export function dedupeByRule(findings: readonly Finding[]): Finding[] {
  const best = new Map<string, Finding>();
  for (const finding of findings) {
    const existing = best.get(finding.ruleId);
    if (!existing || finding.weight > existing.weight) {
      best.set(finding.ruleId, finding);
    }
  }
  return [...best.values()];
}

/** Cap the number of matches so one rule cannot dominate by repetition. */
export function capMatches(matches: readonly Match[], limit = MAX_MATCHES_PER_FINDING): Match[] {
  if (matches.length <= limit) return [...matches];
  return [...matches].slice(0, limit);
}

export function verdictFor(score: number): Verdict {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical risk',
};

/**
 * Per-category 0..100 score for the breakdown chart.
 *
 * Each category is the noisy-OR of its own non-mitigated findings plus any
 * combination boost that involves it, so a category that is part of a strong
 * pair shows the effect of the pair.
 */
export function computeCategoryScores(
  findings: readonly Finding[],
  combos: readonly ComboBoost[],
): Record<Category, number> {
  const scores = {} as Record<Category, number>;
  for (const category of CATEGORIES) scores[category] = 0;

  for (const finding of findings) {
    if (finding.mitigated) continue;
    scores[finding.category] = noisyOr([scores[finding.category], finding.weight]) * 100;
  }

  for (const combo of combos) {
    for (const category of combo.categories) {
      scores[category] = noisyOr([scores[category], combo.weight]) * 100;
    }
  }

  for (const category of CATEGORIES) {
    scores[category] = Math.round(Math.min(100, Math.max(0, scores[category])));
  }
  return scores;
}

/**
 * The combination boosts that apply, given the set of categories with at least
 * one non-mitigated finding.
 */
export function combosFor(findings: readonly Finding[]): ComboBoost[] {
  const present = new Set<Category>();
  for (const finding of findings) {
    if (!finding.mitigated) present.add(finding.category);
  }
  return evaluateCombinations(present);
}

/**
 * Combine base risk, combination boosts and mitigation reductions into a
 * final 0..100 score. Returns the intermediate values so the UI can explain
 * exactly how the number was reached.
 */
export function computeScore(input: {
  findings: readonly Finding[];
  combos: readonly ComboBoost[];
  mitigationReduction: number;
}): {
  score: number;
  risk: number;
  baseRisk: number;
  comboRisk: number;
  afterMitigation: number;
} {
  const active = input.findings.filter((f) => !f.mitigated);
  const baseRisk = noisyOr(active.map((f) => f.weight));

  // Combination boosts are additional noisy-OR terms on top of the base risk.
  let comboFactor = 1;
  for (const combo of input.combos) comboFactor *= 1 - combo.weight;
  const comboRisk = 1 - comboFactor;

  const combined = 1 - (1 - baseRisk) * (1 - comboRisk);
  const afterMitigation = Math.max(0, combined * (1 - input.mitigationReduction));

  return {
    score: Math.round(afterMitigation * 100),
    risk: afterMitigation,
    baseRisk,
    comboRisk,
    afterMitigation,
  };
}
