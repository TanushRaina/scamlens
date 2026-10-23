/**
 * ScamLens engine type definitions.
 *
 * IMPORTANT: this module must stay framework-free. It must not import React,
 * or anything that reaches into the DOM. The UI imports these types from the
 * engine; the engine never imports back.
 */

/** The nine risk categories a finding can belong to. */
export type Category =
  | 'credential_theft'
  | 'urgency'
  | 'financial_lure'
  | 'impersonation'
  | 'payment_redflag'
  | 'suspicious_link'
  | 'contact_pattern'
  | 'language_quality'
  | 'regional';

/** Every category, in the stable order used for the chart and legend. */
export const CATEGORIES: readonly Category[] = [
  'credential_theft',
  'urgency',
  'financial_lure',
  'impersonation',
  'payment_redflag',
  'suspicious_link',
  'contact_pattern',
  'language_quality',
  'regional',
];

/** Human labels per category, used by the UI legend and charts. */
export const CATEGORY_LABEL: Record<Category, string> = {
  credential_theft: 'Credential theft',
  urgency: 'Urgency pressure',
  financial_lure: 'Money lure',
  impersonation: 'Impersonation',
  payment_redflag: 'Payment red flag',
  suspicious_link: 'Suspicious link',
  contact_pattern: 'Contact pattern',
  language_quality: 'Language quality',
  regional: 'Region-specific (India)',
};

/** Stable colour per category. The UI uses this for the legend. */
export const CATEGORY_COLOR: Record<Category, string> = {
  credential_theft: '#ef4444',
  urgency: '#f97316',
  financial_lure: '#eab308',
  impersonation: '#a855f7',
  payment_redflag: '#ec4899',
  suspicious_link: '#3b82f6',
  contact_pattern: '#14b8a6',
  language_quality: '#64748b',
  regional: '#22c55e',
};

/** What shape of input the user pasted. */
export type InputType = 'message' | 'url';

/** A static description of one detection rule. */
export interface Rule {
  /** Stable id, e.g. "otp_request". */
  id: string;
  category: Category;
  /** Short title shown on the explanation card. */
  label: string;
  /** 0..1 — how strongly this signal alone indicates a scam. */
  weight: number;
  /**
   * Patterns are always global so we can capture offsets for highlighting.
   * Patterns run against the normalised text; `matches` are remapped to the
   * original text by normalize.ts.
   */
  patterns: RegExp[];
  /** Why this is suspicious — shown verbatim in the UI. */
  explanation: string;
  /** What a legitimate sender would do instead. */
  legitimateBehavior: string;
  /** Optional extra advice shown in the "what to do now" section. */
  advice?: string;
  /**
   * Optional. When true the rule is matched against the RAW text instead of
   * the folded lowercase layers. Used only by language-quality rules that
   * need to see capitalisation / punctuation / emoji as actually written.
   */
  rawOnly?: boolean;
}

/** A single occurrence of a rule inside the text. */
export interface Match {
  start: number;
  end: number;
  text: string;
}

/** One triggered rule, with its evidence. */
export interface Finding {
  ruleId: string;
  category: Category;
  label: string;
  weight: number;
  matches: Match[];
  explanation: string;
  legitimateBehavior: string;
  /** True when a mitigation downgraded this finding. */
  mitigated?: boolean;
  /** Human-readable reason the finding was downgraded. */
  mitigationReason?: string;
  /** Short, direct instruction shown on the card and in the action list. */
  advice?: string;
}

/** A combination-of-signals boost, reported to the UI. */
export interface ComboBoost {
  id: string;
  categories: Category[];
  title: string;
  explanation: string;
  /** Extra risk contributed by this combination, 0..1. */
  weight: number;
}

/** A mitigation that reduced the score, reported to the UI. */
export interface Mitigation {
  id: string;
  /** Category this mitigation applies to, if any. */
  category?: Category;
  title: string;
  explanation: string;
  /** How much risk this mitigation removed, 0..1. */
  reduction: number;
}

/** A single structural URL check result. */
export interface UrlCheck {
  id: string;
  label: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  detail: string;
}

/** Static analysis result for one URL found in the input. */
export interface UrlAnalysis {
  raw: string;
  /** Normalised (scheme-prefixed) URL. */
  normalized: string;
  host: string;
  /** Registrable domain, e.g. "example.com". */
  registrableDomain: string;
  trusted: boolean;
  suspicious: boolean;
  score: number;
  checks: UrlCheck[];
  /** Similar brands this host was matched against. */
  lookalikeOf?: string[];
  /** Human-readable one-line verdict. */
  verdict: string;
}

/** A single contributing term in the score derivation. */
export interface ScoreTerm {
  /** Which finding/combo/mitigation this term came from. */
  source: string;
  kind: 'finding' | 'combination' | 'mitigation' | 'baseline';
  weight: number;
  note: string;
}

export type Verdict = 'low' | 'medium' | 'high' | 'critical';

export interface AnalysisResult {
  id: string;
  createdAt: number;
  inputText: string;
  inputType: InputType;
  score: number;
  verdict: Verdict;
  findings: Finding[];
  combos: ComboBoost[];
  mitigations: Mitigation[];
  /** Per-category 0..100 score for the chart. */
  categoryScores: Record<Category, number>;
  /** Merged highlight ranges on the ORIGINAL text. */
  highlights: Highlight[];
  urls: UrlAnalysis[];
  actions: string[];
  engineVersion: string;
  /** Exact terms used to derive `score`, for the "Show the math" panel. */
  scoreTerms: ScoreTerm[];
  /** True when the input was too short to say anything useful. */
  insufficientInput: boolean;
  /** Plain-language summary of the tricks used. */
  tricks: string[];
}

export interface Highlight {
  start: number;
  end: number;
  category: Category;
  ruleId: string;
}

/** Options accepted by the single analysis entry point. */
export interface AnalyzeOptions {
  /** Freeze the engine version label (used by tests). */
  engineVersion?: string;
  /** Provide an id (tests) instead of generating one. */
  id?: string;
  /** Override "now" (tests). */
  now?: number;
}
