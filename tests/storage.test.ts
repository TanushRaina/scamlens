/**
 * Storage tests: PII masking and the history store (including recovery from
 * corrupted data and the in-memory fallback).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { maskPersonalData, hasPersonalData, MASK_CHAR } from '../src/storage/mask';
import {
  STORAGE_KEY,
  MAX_SCANS,
  addScan,
  resetMemoryState,
  clearScans,
  emptyState,
  type HistoryState,
  exportHistoryJson,
  importHistoryJson,
  isStorageAvailable,
  loadState,
  migrate,
  prepareScan,
  removeScan,
  saveState,
  sanitizeScan,
} from '../src/storage/historyStore';

/** Minimal Storage-compatible object with an injectable failure mode. */
function fakeStorage(failOn: (key: string) => Error | null) {
  const store = new Map<string, string>();
  return {
    store,
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      const failure = failOn(key);
      if (failure) throw failure;
      store.set(key, String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    key(index: number): string | null {
      return [...store.keys()][index] ?? null;
    },
    get length(): number {
      return store.size;
    },
  };
}

/** Install a fake storage object for the duration of `fn`. */
function withStorage(storage: unknown, fn: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  try {
    fn();
  } finally {
    if (descriptor) {
      Object.defineProperty(window, 'localStorage', descriptor);
    } else {
      delete (window as unknown as Record<string, unknown>).localStorage;
    }
  }
}
import { analyze } from '../src/engine/analyze';

beforeEach(() => {
  window.localStorage.clear();
  resetMemoryState();
});

describe('PII masking', () => {
  it('masks a 10-digit phone number', () => {
    const masked = maskPersonalData('Call me on 9876543210 now');
    expect(masked).toBe(`Call me on ${MASK_CHAR.repeat(10)} now`);
  });

  it('masks a phone number with a country code', () => {
    const masked = maskPersonalData('+91 9876543210');
    expect(masked).not.toContain('9876543210');
  });

  it('masks the local part of an email but keeps the domain', () => {
    const masked = maskPersonalData('Write to john.doe@example.com please');
    expect(masked).toContain('@example.com');
    expect(masked).not.toContain('john.doe');
  });

  it('masks a card number written in groups of four', () => {
    const masked = maskPersonalData('Card 5123 4567 8901 2345');
    expect(masked).not.toContain('5123');
    expect(masked).not.toContain('4567');
    expect(masked).not.toContain('2345');
  });

  it('masks an Aadhaar-style 12-digit number', () => {
    const masked = maskPersonalData('Aadhaar 123456789012');
    expect(masked).not.toContain('123456789012');
  });

  it('masks a PAN', () => {
    const masked = maskPersonalData('PAN ABCDE1234F');
    expect(masked).not.toContain('ABCDE1234F');
  });

  it('masks a UPI handle local part', () => {
    const masked = maskPersonalData('Pay at rahul@ybl');
    expect(masked).toContain('@ybl');
    expect(masked).not.toContain('rahul');
  });

  it('preserves length so highlight offsets stay valid', () => {
    const original = 'OTP 482913. Call 9876543210 or mail a@b.com';
    const masked = maskPersonalData(original);
    expect(masked.length).toBe(original.length);
  });

  it('leaves a message without personal data untouched', () => {
    const text = 'Your OTP is 482913. Do not share it.';
    expect(maskPersonalData(text)).toBe(text);
    expect(hasPersonalData(text)).toBe(false);
  });
});

describe('history store', () => {
  it('starts empty when nothing has been stored', () => {
    const state = loadState();
    expect(state.ok).toBe(true);
    if (state.ok) {
      expect(state.value.scans).toEqual([]);
      expect(state.value.version).toBe(1);
    }
  });

  it('round-trips a saved state', () => {
    const scan = analyze('Share your OTP', { now: 123, id: 'scan-1' });
    const state = addScan(emptyState(), scan);
    const saved = saveState(state);
    expect(saved.ok).toBe(true);

    const loaded = loadState();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.scans).toHaveLength(1);
      expect(loaded.value.scans[0]?.id).toBe('scan-1');
      expect(loaded.value.scans[0]?.score).toBe(scan.score);
    }
  });

  it('recovers gracefully from corrupted JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');
    const loaded = loadState();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.recovered).toBe(true);
      expect(loaded.value.scans).toEqual([]);
    }
  });

  it('drops unusable entries and repairs unknown verdicts', () => {
    const good = analyze('Share your OTP', { now: 1, id: 'good' });
    const bad = { ...good, verdict: 'catastrophic' as never };
    const state = migrate({
      version: 1,
      settings: emptyState().settings,
      scans: [good, bad, 'nonsense', 42],
    });
    expect(state.scans).toHaveLength(2);
    expect(state.scans.every((s) => s.verdict === 'low' || s.verdict === 'high')).toBe(true);
  });

  it('rejects entries that are not analysis results', () => {
    expect(sanitizeScan('nope')).toBeNull();
    expect(sanitizeScan({ id: 'x' })).toBeNull();
    expect(sanitizeScan(null)).toBeNull();
  });

  it('caps history at 100 scans, dropping the oldest', () => {
    let state: HistoryState = emptyState();
    for (let i = 0; i < MAX_SCANS + 10; i += 1) {
      const scan = analyze(`Message number ${i}`, { now: i, id: `scan-${i}` });
      state = addScan(state, scan);
    }
    expect(state.scans).toHaveLength(MAX_SCANS);
    expect(state.scans[0]?.id).toBe(`scan-${MAX_SCANS + 9}`);
    expect(state.scans[state.scans.length - 1]?.id).toBe('scan-10');
    expect(state.scans.map((s) => s.id)).not.toContain('scan-0');
  });

  it('removes and clears scans', () => {
    const first = analyze('Share your OTP', { now: 1, id: 'a' });
    const second = analyze('Pay via gift card', { now: 2, id: 'b' });
    let state = addScan(addScan(emptyState(), first), second);
    state = removeScan(state, 'a');
    expect(state.scans.map((s) => s.id)).toEqual(['b']);
    state = clearScans(state);
    expect(state.scans).toEqual([]);
  });

  it('exports and imports history', () => {
    const scan = analyze('Share your OTP', { now: 5, id: 'a' });
    const state = addScan(emptyState(), scan);
    const json = exportHistoryJson(state);

    const imported = importHistoryJson(json);
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.value.scans).toHaveLength(1);
      expect(imported.value.scans[0]?.id).toBe('a');
    }

    // A bare array of scans is also accepted.
    const bare = importHistoryJson(JSON.stringify([scan]));
    expect(bare.ok).toBe(true);
    if (bare.ok) expect(bare.value.scans).toHaveLength(1);

    // Garbage is rejected with a reason.
    const broken = importHistoryJson('{{{');
    expect(broken.ok).toBe(false);
  });

  it('masks personal data before storing when the toggle is on', () => {
    const scan = analyze('Call me on 9876543210', { now: 1, id: 'a' });
    const masked = prepareScan(scan, { autoSave: true, maskPersonalData: true, theme: 'light' });
    expect(masked.inputText).not.toContain('9876543210');

    const unmasked = prepareScan(scan, { autoSave: true, maskPersonalData: false, theme: 'light' });
    expect(unmasked.inputText).toBe(scan.inputText);
  });

  it('falls back to memory when localStorage is unavailable', () => {
    withStorage(
      fakeStorage(() => new Error('blocked')),
      () => {
        expect(isStorageAvailable()).toBe(false);
        const saved = saveState(addScan(emptyState(), analyze('Share your OTP', { now: 1, id: 'mem' })));
        expect(saved.ok).toBe(false);
        if (!saved.ok) expect(saved.reason.length).toBeGreaterThan(10);

        const loaded = loadState();
        expect(loaded.ok).toBe(true);
        if (loaded.ok) expect(loaded.value.scans).toHaveLength(1);
      },
    );
  });

  it('reports a friendly reason when storage is full', () => {
    withStorage(
      fakeStorage((key) => (key === STORAGE_KEY ? new Error('QuotaExceededError') : null)),
      () => {
        expect(isStorageAvailable()).toBe(true);
        const saved = saveState(addScan(emptyState(), analyze('Share your OTP', { now: 1, id: 'quota' })));
        expect(saved.ok).toBe(false);
        if (!saved.ok) expect(saved.reason).toContain('QuotaExceededError');
      },
    );
  });
});
