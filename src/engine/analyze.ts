/**
 * The single analysis entry point.
 *
 *   analyze(text, options) -> AnalysisResult
 *
 * Everything downstream (scoring, highlights, actions, URL checks) is composed
 * here. Nothing in this file imports React or touches the DOM, so the whole
 * engine can be unit-tested and reused outside the browser.
 */

import type {
  AnalysisResult,
  AnalyzeOptions,
  Category,
  Finding,
  UrlAnalysis,
  Match,
  Rule,
  ScoreTerm,
  Verdict,
} from './types';
import { CATEGORIES, CATEGORY_LABEL } from './types';
import { MAX_INPUT_LENGTH, normalize, type Layer, type Obfuscation } from './normalize';
import { RULES } from './rules';
import { extractUrls, isWholeInputUrl, type ExtractedUrl } from './url/parseUrls';
import { analyzeUrl } from './url/analyzeUrl';
import { applyMitigations } from './mitigations';
import { buildHighlights } from './highlight';
import {
  capMatches,
  combosFor,
  computeCategoryScores,
  computeScore,
  dedupeByRule,
  verdictFor,
} from './scoring';

export const ENGINE_VERSION = '1.0.0';

/** Below this, there is not enough text to say anything meaningful. */
const MIN_INPUT_LENGTH = 4;

/** Obfuscation kinds that indicate deliberate disguise rather than a glitch. */
const SEVERE_OBFUSCATION: ReadonlySet<Obfuscation['kind']> = new Set([
  'homoglyph',
  'spaced_letters',
  'leet',
  'repeated_chars',
  'fullwidth',
  'ligature',
]);

/** Whole-text obfuscation markers cannot be highlighted precisely. */
const WHOLE_TEXT_OBFUSCATION: ReadonlySet<Obfuscation['kind']> = new Set([
  'homoglyph',
  'fullwidth',
  'ligature',
]);

function identityLayer(text: string): Layer {
  return { text, map: Array.from({ length: text.length }, (_, i) => i) };
}

/**
 * Run one pattern over one layer and remap every match into the original text.
 *
 * The loop is deliberately defensive: a non-global pattern cannot be advanced
 * by `lastIndex`, so it is executed once and the loop is broken out of. Without
 * that guard a rule author who forgets the `g` flag would hang the browser.
 */
function runPattern(pattern: RegExp, layerText: string, map: readonly number[]): Match[] {
  const out: Match[] = [];
  pattern.lastIndex = 0;
  let m = pattern.exec(layerText);
  if (!pattern.global) {
    if (m) {
      const end = m.index + (m[0]?.length ?? 0);
      if (m[0] && end - m.index > 0 && m.index < map.length && end - 1 < map.length) {
        out.push({ start: map[m.index] as number, end: (map[end - 1] as number) + 1, text: m[0] });
      }
    }
    return out;
  }
  while (m) {
    const start = m.index;
    const end = start + (m[0]?.length ?? 0);
    if (end > start && start < map.length && end - 1 < map.length) {
      out.push({ start: map[start] as number, end: (map[end - 1] as number) + 1, text: m[0] });
    }
    if ((m[0]?.length ?? 0) === 0) {
      // Zero-width match: nudge past it so the scan always advances.
      pattern.lastIndex = start + 1;
    }
    m = pattern.exec(layerText);
  }
  return out;
}

/** Keep the shortest match per original start position. */
function dedupeMatches(matches: readonly Match[]): Match[] {
  const byStart = new Map<number, Match>();
  for (const match of matches) {
    const existing = byStart.get(match.start);
    if (!existing || match.end - match.start < existing.end - existing.start) {
      byStart.set(match.start, match);
    }
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start);
}

/** Run every rule over the appropriate layers and return findings. */
function runRules(rules: readonly Rule[], layers: readonly Layer[]): Finding[] {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const collected: Match[] = [];
    for (const pattern of rule.patterns) {
      for (const layer of layers) {
        collected.push(...runPattern(pattern, layer.text, layer.map));
      }
    }

    const matches = dedupeMatches(collected);
    if (matches.length === 0) continue;

    findings.push({
      ruleId: rule.id,
      category: rule.category,
      label: rule.label,
      weight: rule.weight,
      matches: capMatches(matches),
      explanation: rule.explanation,
      legitimateBehavior: rule.legitimateBehavior,
    });
  }

  return findings;
}

/** Build the synthetic finding that reports obfuscation. */
function buildObfuscationFinding(obfuscations: readonly Obfuscation[], original: string): Finding | null {
  if (obfuscations.length === 0) return null;

  const severe = obfuscations.some((o) => SEVERE_OBFUSCATION.has(o.kind));
  const precise = obfuscations.filter((o) => !WHOLE_TEXT_OBFUSCATION.has(o.kind));

  const matches: Match[] = precise.map((o) => {
    const start = Math.max(0, Math.min(o.start, original.length - 1));
    const end = Math.max(start + 1, Math.min(o.end, original.length));
    return { start, end, text: original.slice(start, end) };
  });

  const detail = obfuscations
    .map((o) => o.detail)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .join(' ');

  return {
    ruleId: 'obfuscated_text',
    category: 'language_quality',
    label: 'Text was deliberately disguised',
    weight: severe ? 0.45 : 0.25,
    matches,
    explanation: detail,
    legitimateBehavior:
      'A genuine sender writes normally. Disguising characters is done to fool spam filters and to make a fake domain look like a real one.',
    advice: 'Treat any disguised text as a warning sign on its own.',
  };
}

/** Findings contributed by the URLs found in the message. */
function buildUrlFindings(
  urls: readonly UrlAnalysis[],
  positions: readonly { raw: string; start: number; end: number }[],
): Finding[] {
  const findings: Finding[] = [];

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i] as UrlAnalysis;
    const position = positions[i] ?? { raw: url.raw, start: 0, end: 0 };
    const match: Match = {
      start: position.start,
      end: position.end > position.start ? position.end : position.start + url.raw.length,
      text: url.raw,
    };

    if (url.trusted) continue;

    if (url.suspicious) {
      findings.push({
        ruleId: 'suspicious_url',
        category: 'suspicious_link',
        label: url.verdict,
        weight: Math.max(0.45, url.score),
        matches: [match],
        explanation:
          'A link is the cheapest way to hand over credentials: everything you type goes to whoever owns that page. This link failed one or more structural checks.',
        legitimateBehavior:
          'A genuine sender explains what happened and points you to the official app or website rather than a link in a message.',
        advice: 'Do not open this link.',
      });
    } else {
      findings.push({
        ruleId: 'unknown_url',
        category: 'suspicious_link',
        label: 'An unknown link was included',
        weight: 0.15,
        matches: [match],
        explanation:
          'The link did not fail any structural check, but its domain is not one we can recognise as belonging to a known brand. Structural checks cannot judge reputation.',
        legitimateBehavior:
          'Only send links from domains you can verify as the genuine operator of the service.',
        advice: 'If you were not expecting this link, do not open it.',
      });
    }
  }

  return findings;
}

function buildActions(findings: readonly Finding[], urls: readonly UrlAnalysis[]): string[] {
  const has = (category: Category): boolean => findings.some((f) => f.category === category);
  const hasRule = (id: string): boolean => findings.some((f) => f.ruleId === id);
  const actions: string[] = [];

  if (urls.some((u) => u.suspicious)) {
    actions.push('Do not click, tap or open any link in this message.');
  }
  if (has('credential_theft')) {
    actions.push(
      'Do not share any OTP, PIN, password, card number or Aadhaar/PAN details — not with anyone who contacted you.',
    );
  }
  if (has('impersonation')) {
    actions.push(
      'Contact the institution yourself using the number on your card, inside the official app, or from the official website — never the number in the message.',
    );
  }
  if (has('payment_redflag')) {
    actions.push('Do not pay, transfer, buy gift cards or send crypto for anyone who contacted you first.');
  }
  if (has('urgency')) {
    actions.push('Ignore the deadline or the threat. Nothing legitimate disappears in minutes.');
  }
  if (hasRule('digital_arrest_in')) {
    actions.push(
      'Do not share anything further and do not pay any "fine" — this is not a real police demand.',
    );
  }
  if (hasRule('upi_collect_in')) {
    actions.push('Reject any UPI Collect request in your payment app instead of accepting it.');
  }
  if (has('financial_lure')) {
    actions.push(
      'Assume nothing has been won, refunded or earned. Check the official source before believing it.',
    );
  }
  if (findings.length > 0) {
    actions.push('Screenshot or save this message before you delete it — it is your evidence.');
    actions.push('Block the sender and report the message in the app you received it on.');
    actions.push('Report it: cybercrime.gov.in or the national cybercrime helpline 1930 (India).');
  }

  return actions;
}

function buildTricks(findings: readonly Finding[]): string[] {
  const seen = new Set<string>();
  const tricks: string[] = [];
  const push = (key: string, text: string): void => {
    if (!seen.has(key)) {
      seen.add(key);
      tricks.push(text);
    }
  };

  const classify: Record<string, string> = {
    obfuscated_text: 'obf',
    suspicious_url: 'link',
    unknown_url: 'link',
    otp_request: 'cred',
    pin_request: 'cred',
    password_request: 'cred',
    card_details_request: 'cred',
    aadhaar_request: 'cred',
    pan_request: 'cred',
    screen_share_request: 'cred',
    account_verify_request: 'cred',
    login_to_confirm: 'cred',
    kyc_document_request: 'cred',
    within_24h: 'urg',
    immediately_act: 'urg',
    account_suspended: 'urg',
    last_warning: 'urg',
    legal_action: 'urg',
    arrest_threat: 'urg',
    sim_deactivate: 'urg',
    expires_today: 'urg',
    bank_impersonation: 'imperson',
    rbi_impersonation: 'imperson',
    income_tax_impersonation: 'imperson',
    courier_impersonation: 'imperson',
    telecom_impersonation: 'imperson',
    ecommerce_impersonation: 'imperson',
    gov_scheme_impersonation: 'imperson',
    tech_support_impersonation: 'imperson',
    customer_care_generic: 'imperson',
    gift_card_payment: 'pay',
    crypto_payment: 'pay',
    wire_transfer: 'pay',
    fee_to_release: 'pay',
    processing_fee: 'pay',
    refundable_deposit: 'pay',
    upi_collect_in: 'pay',
    won_prize: 'lure',
    lottery_claim: 'lure',
    guaranteed_returns: 'lure',
    double_money: 'lure',
    easy_income: 'lure',
    reward_claim: 'lure',
    loan_approval_easy: 'lure',
    cashback_offer: 'lure',
    investment_pitch: 'lure',
    fake_refund_offer: 'lure',
    fake_job_task: 'lure',
    secrecy_request: 'secrecy',
  };

  for (const finding of findings) {
    const key = classify[finding.ruleId];
    if (!key) continue;
    switch (key) {
      case 'obf':
        push('obf', 'It disguised some characters so the words looked ordinary.');
        break;
      case 'link':
        push('link', 'It gave you a link instead of explaining what happened.');
        break;
      case 'cred':
        push('cred', 'It asked for something that unlocks your account.');
        break;
      case 'urg':
        push('urg', 'It tried to rush you with a deadline or a threat.');
        break;
      case 'imperson':
        push('imperson', 'It claimed to be someone you already trust.');
        break;
      case 'pay':
        push('pay', 'It asked for money in a way that cannot be reversed.');
        break;
      case 'lure':
        push('lure', 'It offered money you did not earn.');
        break;
      case 'secrecy':
        push('secrecy', 'It told you not to tell anyone else.');
        break;
      default:
        break;
    }
  }
  return tricks;
}

function emptyCategoryScores(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
}

function neutralResult(text: string, now: number, id: string): AnalysisResult {
  return {
    id,
    createdAt: now,
    inputText: text,
    inputType: 'message',
    score: 0,
    verdict: 'low',
    findings: [],
    combos: [],
    mitigations: [],
    categoryScores: emptyCategoryScores(),
    highlights: [],
    urls: [],
    actions: ['Paste a suspicious message, email, SMS or URL to analyse it.'],
    engineVersion: ENGINE_VERSION,
    scoreTerms: [
      {
        source: 'insufficient_input',
        kind: 'baseline',
        weight: 0,
        note: `Only ${text.trim().length} character(s) of input. At least ${MIN_INPUT_LENGTH} are needed to make a judgment.`,
      },
    ],
    insufficientInput: true,
    tricks: [],
  };
}

/**
 * Analyze a suspicious message, email, SMS or URL.
 */
export function analyze(text: string, options: AnalyzeOptions = {}): AnalysisResult {
  const now = options.now ?? Date.now();
  const id = options.id ?? `scamlens-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const trimmed = text.trim();

  if (trimmed.length < MIN_INPUT_LENGTH) {
    return neutralResult(text, now, id);
  }

  const original = text.slice(0, MAX_INPUT_LENGTH);
  const normalized = normalize(original);
  const inputType = isWholeInputUrl(original) ? 'url' : 'message';

  // --- 1. Rule findings -------------------------------------------------
  const keywordFindings = runRules(RULES, [
    normalized.deobfuscated,
    normalized.deobfuscatedAlt,
    normalized.compressed,
  ]);
  const rawFindings = runRules(
    RULES.filter((rule) => rule.rawOnly),
    [identityLayer(original)],
  );

  const findings: Finding[] = [...keywordFindings, ...rawFindings];

  const obfuscationFinding = buildObfuscationFinding(normalized.obfuscations, original);
  if (obfuscationFinding) findings.push(obfuscationFinding);

  // --- 2. URLs ----------------------------------------------------------
  const extracted: ExtractedUrl[] = extractUrls(original);
  const urls = extracted.map((u) => analyzeUrl(u.raw, u.normalized));
  findings.push(...buildUrlFindings(urls, extracted));

  // --- 3. Deduplicate by rule, keeping the strongest -------------------
  const deduped = dedupeByRule(findings);

  // --- 4. Mitigations ---------------------------------------------------
  const mitigationResult = applyMitigations({
    original,
    normalized: normalized.deobfuscated.text,
    findings: deduped,
    urls,
  });
  const finalFindings = mitigationResult.findings;

  // --- 5. Combinations and score ----------------------------------------
  const combos = combosFor(finalFindings);
  const { score, risk, baseRisk, comboRisk } = computeScore({
    findings: finalFindings,
    combos,
    mitigationReduction: mitigationResult.reduction,
  });
  const verdict: Verdict = verdictFor(score);
  const categoryScores = computeCategoryScores(finalFindings, combos);

  // --- 6. Highlights (ranges on the ORIGINAL text) ----------------------
  const highlights = buildHighlights(finalFindings);

  // --- 7. Score terms for the "show the math" panel --------------------
  const scoreTerms: ScoreTerm[] = [
    { source: 'baseline', kind: 'baseline', weight: 0, note: 'Starting point: no single signal yet.' },
  ];
  for (const finding of finalFindings) {
    if (finding.mitigated) continue;
    scoreTerms.push({
      source: finding.ruleId,
      kind: 'finding',
      weight: finding.weight,
      note: `${finding.label} (${CATEGORY_LABEL[finding.category]})`,
    });
  }
  for (const combo of combos) {
    scoreTerms.push({ source: combo.id, kind: 'combination', weight: combo.weight, note: combo.title });
  }
  for (const mitigation of mitigationResult.mitigations) {
    scoreTerms.push({
      source: mitigation.id,
      kind: 'mitigation',
      weight: -mitigation.reduction,
      note: mitigation.title,
    });
  }
  scoreTerms.push({
    source: 'noisy-or',
    kind: 'baseline',
    weight: risk,
    note: `Base ${Math.round(baseRisk * 100)} + combinations ${Math.round(comboRisk * 100)} → ${Math.round(risk * 100)}/100`,
  });

  return {
    id,
    createdAt: now,
    inputText: original,
    inputType,
    score,
    verdict,
    findings: finalFindings,
    combos,
    mitigations: mitigationResult.mitigations,
    categoryScores,
    highlights,
    urls,
    actions: buildActions(finalFindings, urls),
    engineVersion: options.engineVersion ?? ENGINE_VERSION,
    scoreTerms,
    insufficientInput: false,
    tricks: buildTricks(finalFindings),
  };
}
