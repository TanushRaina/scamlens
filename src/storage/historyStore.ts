/**
 * localStorage-backed history, with an in-memory fallback.
 *
 * Every read and write is wrapped in try/catch: private browsing, disabled
 * storage or a full quota must degrade to a friendly message rather than break
 * the app. Corrupted JSON is recovered by rebuilding from whatever valid
 * entries remain.
 */

import type { AnalysisResult, Verdict } from '../engine/types';
import { maskPersonalData } from './mask';

export const STORAGE_KEY = 'scamlens:v1';
export const CURRENT_VERSION = 1;
export const MAX_SCANS = 100;

export type ThemeMode = 'light' | 'dark';

export interface Settings {
  autoSave: boolean;
  maskPersonalData: boolean;
  theme: ThemeMode;
}

export const DEFAULT_SETTINGS: Settings = {
  autoSave: true,
  maskPersonalData: true,
  theme: 'light',
};

export interface HistoryState {
  version: 1;
  settings: Settings;
  scans: AnalysisResult[];
}

export type StorageFailure = { ok: false; reason: string };
export type StorageSuccess<T> = { ok: true; value: T };
export type StorageResult<T> = StorageSuccess<T> | StorageFailure;

/** Kept when localStorage is unavailable, so history survives the session. */
let memoryState: HistoryState = emptyState();

/** True when localStorage can actually be used. */
export function isStorageAvailable(): boolean {
  try {
    const probe = '__scamlens_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function emptyState(): HistoryState {
  return { version: CURRENT_VERSION, settings: { ...DEFAULT_SETTINGS }, scans: [] };
}

/** True when the value looks like a usable AnalysisResult. */
function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false;
  if (typeof candidate.createdAt !== 'number') return false;
  if (typeof candidate.inputText !== 'string') return false;
  if (typeof candidate.score !== 'number') return false;
  if (typeof candidate.verdict !== 'string') return false;
  if (!Array.isArray(candidate.findings)) return false;
  if (!Array.isArray(candidate.actions)) return false;
  if (!Array.isArray(candidate.urls)) return false;
  return true;
}

const VERDICTS: ReadonlySet<string> = new Set(['low', 'medium', 'high', 'critical']);

/**
 * Validate a single stored scan.
 *
 * Returns a repaired copy when only cosmetic fields are wrong, and null when the
 * entry is unusable. A verdict outside the known set is normalised to "low".
 */
export function sanitizeScan(value: unknown): AnalysisResult | null {
  if (!isAnalysisResult(value)) return null;

  const source = value as unknown as Record<string, unknown>;
  const verdict = VERDICTS.has(String(source.verdict)) ? (source.verdict as Verdict) : 'low';

  return {
    ...(source as unknown as AnalysisResult),
    verdict,
    score: Math.max(0, Math.min(100, Math.round(source.score as number))),
    findings: Array.isArray(source.findings) ? source.findings : [],
    urls: Array.isArray(source.urls) ? source.urls : [],
    actions: Array.isArray(source.actions) ? source.actions : [],
    highlights: Array.isArray(source.highlights) ? source.highlights : [],
    scoreTerms: Array.isArray(source.scoreTerms) ? source.scoreTerms : [],
    combos: Array.isArray(source.combos) ? source.combos : [],
    mitigations: Array.isArray(source.mitigations) ? source.mitigations : [],
    tricks: Array.isArray(source.tricks) ? source.tricks : [],
  };
}

function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.autoSave === 'boolean' &&
    typeof candidate.maskPersonalData === 'boolean' &&
    (candidate.theme === 'light' || candidate.theme === 'dark')
  );
}

/**
 * Migration stub.
 *
 * Future versions: add a `case CURRENT_VERSION - 1:` branch that converts the
 * older shape into the current one, then returns the upgraded state.
 */
export function migrate(raw: unknown): HistoryState {
  if (typeof raw !== 'object' || raw === null) return emptyState();
  const candidate = raw as Record<string, unknown>;

  if (candidate.version !== CURRENT_VERSION) {
    // Unknown or future version: keep the scans if they are usable, reset settings.
    return {
      version: CURRENT_VERSION,
      settings: { ...DEFAULT_SETTINGS },
      scans: Array.isArray(candidate.scans)
        ? candidate.scans.map(sanitizeScan).filter((s): s is AnalysisResult => s !== null)
        : [],
    };
  }

  const state: HistoryState = {
    version: CURRENT_VERSION,
    settings: isSettings(candidate.settings) ? candidate.settings : { ...DEFAULT_SETTINGS },
    scans: [],
  };

  if (Array.isArray(candidate.scans)) {
    for (const scan of candidate.scans) {
      const clean = sanitizeScan(scan);
      if (clean) state.scans.push(clean);
    }
  }

  return state;
}

/** Load history, recovering gracefully from corrupted JSON. */
export function loadState(): StorageResult<HistoryState> & { recovered: boolean } {
  let recovered = false;

  if (!isStorageAvailable()) {
    return { ok: true, value: memoryState, recovered };
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: true, value: memoryState, recovered };
  }

  if (raw === null) {
    return { ok: true, value: emptyState(), recovered };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return { ok: true, value: migrate(parsed), recovered };
  } catch {
    recovered = true;
    try {
      return { ok: true, value: migrate(memoryState), recovered };
    } catch {
      return { ok: true, value: emptyState(), recovered };
    }
  }
}

/** Persist history. Returns a failure reason when storage is unavailable or full. */
export function saveState(state: HistoryState): StorageResult<void> {
  memoryState = state;

  if (!isStorageAvailable()) {
    return {
      ok: false,
      reason: 'Storage is unavailable in this browser. History is kept for this session only.',
    };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true, value: undefined };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Storage write failed.';
    return {
      ok: false,
      reason: `Could not save history (${reason}). History is kept for this session only.`,
    };
  }
}

/**
 * Clear the in-memory fallback. Used by tests between cases; the app never
 * calls this.
 */
export function resetMemoryState(): void {
  memoryState = emptyState();
}

/** Append a scan, dropping the oldest when the cap is exceeded. */
export function addScan(state: HistoryState, scan: AnalysisResult): HistoryState {
  const next: AnalysisResult[] = [scan, ...state.scans];
  if (next.length > MAX_SCANS) next.length = MAX_SCANS;
  return { ...state, scans: next };
}

export function removeScan(state: HistoryState, id: string): HistoryState {
  return { ...state, scans: state.scans.filter((s) => s.id !== id) };
}

export function clearScans(state: HistoryState): HistoryState {
  return { ...state, scans: [] };
}

/** Build the stored copy of a scan, masking personal data when requested. */
export function prepareScan(scan: AnalysisResult, settings: Settings): AnalysisResult {
  if (!settings.maskPersonalData) return scan;
  const maskedText = maskPersonalData(scan.inputText);
  return maskedText === scan.inputText ? scan : { ...scan, inputText: maskedText };
}

/** Serialise history for download. */
export function exportHistoryJson(state: HistoryState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parse an imported history file.
 *
 * Accepts either a full state object or a bare array of scans.
 */
export function importHistoryJson(text: string): StorageResult<HistoryState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'The file is not valid JSON.' };
  }

  if (Array.isArray(parsed)) {
    const scans = parsed.map(sanitizeScan).filter((s): s is AnalysisResult => s !== null);
    return { ok: true, value: { version: CURRENT_VERSION, settings: { ...DEFAULT_SETTINGS }, scans } };
  }

  return { ok: true, value: migrate(parsed) };
}
