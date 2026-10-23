/**
 * Presentation constants shared by the results panel.
 *
 * Kept in one place so the gauge, the verdict badge and the summary sentence
 * always agree on colours and wording.
 */

import type { Verdict } from './engine/types';

export interface VerdictStyle {
  /** Short label, e.g. "High risk". */
  label: string;
  /** Score band, e.g. "60–79". */
  band: string;
  /** Hex used for the SVG gauge stroke and the chart dots. */
  color: string;
  /** Tailwind classes for badge backgrounds and borders. */
  badge: string;
  /** Tailwind classes for inline text colour. */
  text: string;
  /** Plain-language sentence used at the top of the results panel. */
  summary: string;
}

export const VERDICT_STYLE: Record<Verdict, VerdictStyle> = {
  low: {
    label: 'Low risk',
    band: '0–29',
    color: '#16a34a',
    badge:
      'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    summary:
      'No strong scam signals were found. This is not a guarantee the message is safe — read it with normal caution.',
  },
  medium: {
    label: 'Medium risk',
    band: '30–59',
    color: '#ca8a04',
    badge:
      'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    summary:
      'Some patterns common in scams are present. Check the details below before acting on the message.',
  },
  high: {
    label: 'High risk',
    band: '60–79',
    color: '#ea580c',
    badge:
      'bg-orange-100 text-orange-800 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
    text: 'text-orange-700 dark:text-orange-400',
    summary: 'Several signals strongly associated with fraud are present. Do not act on this message.',
  },
  critical: {
    label: 'Critical risk',
    band: '80–100',
    color: '#dc2626',
    badge: 'bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
    text: 'text-red-700 dark:text-red-400',
    summary: 'This message matches the pattern of an active scam. Do not click, reply, or send anything.',
  },
};

/** Verdict order used when sorting history entries. */
export const VERDICT_ORDER: readonly Verdict[] = ['critical', 'high', 'medium', 'low'];

/** Format a 0..1 weight as a percentage for the explanation cards. */
export function formatWeight(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

/** Format a signed score contribution for the "show the math" panel. */
export function formatTermWeight(weight: number): string {
  const sign = weight < 0 ? '−' : '+';
  return `${sign}${Math.abs(Math.round(weight * 100))} pts`;
}

/** Human date/time for history entries. */
export function formatTimestamp(epochMs: number): string {
  try {
    return new Date(epochMs).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date(epochMs).toString();
  }
}
