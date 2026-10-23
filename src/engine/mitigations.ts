/**
 * Mitigations: reasons to *lower* the risk.
 *
 * ScamLens is a risk estimator, so it must be able to say "this looks like a
 * warning, not a request". These are the contexts in which a suspicious phrase
 * is explained away, and every one of them is shown to the user — a mitigation
 * that is applied silently would be an unexplained verdict, which this product
 * promises never to produce.
 */

import type { Finding, Mitigation, UrlAnalysis } from './types';

/** Phrases that turn a credential keyword into a warning rather than a request. */
const NEGATION_PATTERNS: readonly RegExp[] = [
  /\bdo not share\b/,
  /\bdon't share\b/,
  /\bnever share\b/,
  /\bnot share\b/,
  /\bdo not disclose\b/,
  /\bnever disclose\b/,
  /\bdo not give\b/,
  /\bdon't give\b/,
  /\bnever give\b/,
  /\bdo not tell\b/,
  /\bdon't tell\b/,
  /\bnever ask\b/,
  /\bwill never ask\b/,
  /\bbank will never\b/,
  /\bno one (?:will |can )?ask\b/,
  /\bnobody (?:will |can )?ask\b/,
  /\bdo not send\b/,
  /\bdon't send\b/,
  /\bnever send\b/,
  /\bwithout asking\b/,
  /\bnever (?:provide|submit|enter|type|read out|forward)\b/,
  /\bplease do not\b/,
  // The user already took the protective action, so the request was not complied with.
  /\bdeclined\b/,
  /\brejected\b/,
  /\bdenied\b/,
  /\byou (?:did not|didn't) accept\b/,
  /\bnot accepted\b/,
  /\b(?:mat batao|kisi ko mat|mat karo|bato mat|mat share karo)\b/,
];

/**
 * How far around a matched keyword we look for a safety warning. Bank alerts
 * put the "do not share" clause a sentence away from the OTP, so the window has
 * to be generous — 120 characters.
 */
const NEGATION_WINDOW = 120;

const MONEY_RE =
  /\b(?:rs\.?|₹|rupees|paisa|paise|paisa|money|cash|amount|fee|charge|charges|prize|reward|cashback|deposit|payment|payout|salary|income|kamai)\b/;

const ASK_RE =
  /\b(?:click|tap|open|install|download|share|send|provide|submit|enter|type|read out|forward|approve|accept|pay|call|contact|verify|update|complete|download karo|karo|karoge|dena|dikhao|batao|mangta)\b/;

const MASKED_ACCOUNT_RE = /(?:a\/?c|account)\s*(?:no\.?\s*)?(?:[*xX]{2,}\s*\d{2,}|\d{4}\s*\*{2,}|\*{4}\d{4})/;

const AMOUNT_RE = /(?:debited|credited|paid|paid to|rs\.?|₹|rupees)\s*(?:rs\.?|₹)?\s*\d+/;

export interface MitigationInput {
  original: string;
  /** Lowercased, deobfuscated layer used for context searches. */
  normalized: string;
  findings: Finding[];
  urls: UrlAnalysis[];
}

export interface MitigationResult {
  findings: Finding[];
  mitigations: Mitigation[];
  /** Total fraction of risk removed, 0..0.9. */
  reduction: number;
}

/** Remove safety warnings so they cannot be mistaken for a request. */
function stripNegations(text: string): string {
  let out = text;
  for (const re of NEGATION_PATTERNS) {
    out = out.replace(re, ' ');
  }
  return out;
}

/** True when a safety warning sits near any of the finding's matches. */
function hasNegationNear(original: string, matches: { start: number; end: number }[]): boolean {
  if (matches.length === 0) return false;

  let earliest = original.length;
  let latest = 0;
  for (const m of matches) {
    earliest = Math.min(earliest, m.start);
    latest = Math.max(latest, m.end);
  }
  const window = original.slice(
    Math.max(0, earliest - NEGATION_WINDOW),
    Math.min(original.length, latest + NEGATION_WINDOW),
  );

  return NEGATION_PATTERNS.some((re) => re.test(window));
}

/**
 * Apply every applicable mitigation and return the adjusted findings.
 */
export function applyMitigations(input: MitigationInput): MitigationResult {
  const { original, normalized, findings, urls } = input;
  const mitigations: Mitigation[] = [];
  const adjusted: Finding[] = [];
  let reduction = 0;

  // --- 1. Safety-warning context --------------------------------------
  const safetyFindings: Finding[] = [];
  for (const finding of findings) {
    if (!['credential_theft', 'impersonation', 'payment_redflag', 'regional'].includes(finding.category)) {
      adjusted.push(finding);
      continue;
    }
    if (finding.mitigated) {
      adjusted.push(finding);
      continue;
    }
    if (hasNegationNear(original, finding.matches)) {
      safetyFindings.push(finding);
    } else {
      adjusted.push(finding);
    }
  }

  for (const finding of safetyFindings) {
    adjusted.push({
      ...finding,
      mitigated: true,
      mitigationReason:
        'A safety warning near the matched text ("do not share", "bank will never ask", or similar) indicates this is a warning about the scam, not a request from it.',
    });
    // Removing this finding's weight from the noisy-OR is worth most of it.
    reduction += Math.min(0.4, finding.weight * 0.8);
    mitigations.push({
      id: `safety_warning_${finding.ruleId}`,
      category: finding.category,
      title: `Safety warning downgrades "${finding.label}"`,
      explanation:
        'The message contains a warning about exactly this kind of request near the matched text. That is the behaviour of a genuine sender protecting you, not of one asking you.',
      reduction: Math.min(0.4, finding.weight * 0.8),
    });
  }

  // --- 2. Trusted domain ---------------------------------------------
  const trustedUrls = urls.filter((u) => u.trusted);
  if (trustedUrls.length > 0) {
    const domains = trustedUrls.map((u) => u.registrableDomain);
    reduction += 0.15;
    mitigations.push({
      id: 'trusted_link',
      category: 'suspicious_link',
      title: 'Link points to a known legitimate domain',
      explanation: `The registrable domain of ${domains.join(', ')} matches a domain operated by a known brand. The link itself is not a structural tell — check it only if you were expecting it.`,
      reduction: 0.15,
    });
    for (let i = 0; i < adjusted.length; i += 1) {
      const f = adjusted[i];
      if (f.category === 'suspicious_link' && !f.mitigated) {
        adjusted[i] = {
          ...f,
          mitigated: true,
          mitigationReason: 'The link points to a domain that matches a known legitimate brand domain.',
        };
      }
    }
  }

  // --- 3. No money, no action, no link ---------------------------------
  const clean = stripNegations(normalized);
  const hasSuspiciousLink = urls.some((u) => u.suspicious);
  const asksForMoney = MONEY_RE.test(clean);
  const asksForAction = ASK_RE.test(clean);

  if (!hasSuspiciousLink && !asksForMoney && !asksForAction) {
    reduction += 0.1;
    mitigations.push({
      id: 'no_money_or_action',
      title: 'No money, no action and no link requested',
      explanation:
        'Nothing in this message asks you to move money, click a link or hand over a credential. The phrases flagged are contextual rather than a request.',
      reduction: 0.1,
    });
  }

  // --- 4. Informational transaction alert ------------------------------
  const isTransactionAlert =
    urls.length === 0 && MASKED_ACCOUNT_RE.test(clean) && AMOUNT_RE.test(clean) && !ASK_RE.test(clean);

  if (isTransactionAlert) {
    reduction += 0.15;
    mitigations.push({
      id: 'transaction_alert',
      title: 'Looks like an informational transaction alert',
      explanation:
        'The message has the shape of a bank debit/credit notification — a masked account reference, an amount and a transaction — with no link and no request. Real banks format alerts this way so that the last four digits alone are not usable.',
      reduction: 0.15,
    });
  }

  reduction = Math.min(0.9, reduction);

  return { findings: adjusted, mitigations, reduction };
}
