/**
 * Combination-of-signals boosts.
 *
 * A single warning is often ambiguous; two warnings that describe the same
 * crime are not. These are applied as *additional noisy-OR terms* on top of
 * the base risk, and each one is reported to the UI with an explanation of
 * why the pair is worse than either signal alone.
 */

import type { Category, ComboBoost } from './types';

export interface ComboDef {
  id: string;
  categories: readonly Category[];
  /** Extra risk contributed when ALL of these categories are present. */
  weight: number;
  title: string;
  explanation: string;
}

export const COMBO_DEFS: readonly ComboDef[] = [
  {
    id: 'credential_plus_urgency',
    categories: ['credential_theft', 'urgency'],
    weight: 0.3,
    title: 'Credential request + a deadline',
    explanation:
      'Asking for an OTP, PIN or card details while claiming something will be blocked is the exact shape of a live account takeover. The urgency stops you checking, and the credential is what they are taking.',
  },
  {
    id: 'impersonation_plus_link',
    categories: ['impersonation', 'suspicious_link'],
    weight: 0.3,
    title: 'Impersonation + a suspicious link',
    explanation:
      'Claiming to be a trusted institution and then handing you a link is how a fake login page gets visited. The identity claim is the lure; the link is the trap.',
  },
  {
    id: 'financial_lure_plus_payment',
    categories: ['financial_lure', 'payment_redflag'],
    weight: 0.3,
    title: 'Money promised + an unusual payment method',
    explanation:
      'A prize, refund or guaranteed return that must be paid for in gift cards or crypto is a scam by construction: the "prize" does not exist and the payment is the whole point.',
  },
  {
    id: 'impersonation_plus_credential',
    categories: ['impersonation', 'credential_theft'],
    weight: 0.3,
    title: 'Impersonation + a credential request',
    explanation:
      'When someone claiming to be an official body asks for your OTP, PIN or Aadhaar, the impersonation is what makes the request seem legitimate. Either one alone is bad; together they are the full attack.',
  },
  {
    id: 'contact_plus_financial',
    categories: ['contact_pattern', 'financial_lure'],
    weight: 0.18,
    title: 'Push to a private chat + a money promise',
    explanation:
      'Moving you to WhatsApp or Telegram before talking about money is done to get you past the fraud screening that exists on normal channels.',
  },
  {
    id: 'contact_plus_payment',
    categories: ['contact_pattern', 'payment_redflag'],
    weight: 0.18,
    title: 'Push to a private chat + an unusual payment',
    explanation:
      'A payment method that cannot be reversed, combined with a channel that has no business identity, means there is nobody to complain to once the money is gone.',
  },
  {
    id: 'regional_plus_link',
    categories: ['regional', 'suspicious_link'],
    weight: 0.3,
    title: 'Indian-specific threat + a suspicious link',
    explanation:
      'A KYC, UPI, FASTag or "digital arrest" threat that ends in a link is the standard Indian phishing shape. The threat manufactures panic; the link harvests the credentials.',
  },
];

/**
 * Return the combination boosts that apply, given the set of categories that
 * have at least one non-mitigated finding.
 */
export function evaluateCombinations(present: ReadonlySet<Category>): ComboBoost[] {
  const combos: ComboBoost[] = [];
  for (const def of COMBO_DEFS) {
    if (def.categories.every((c) => present.has(c))) {
      combos.push({
        id: def.id,
        categories: [...def.categories],
        title: def.title,
        explanation: def.explanation,
        weight: def.weight,
      });
    }
  }
  return combos;
}
