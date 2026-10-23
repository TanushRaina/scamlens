/**
 * Vitest setup: DOM cleanup plus the handful of browser APIs jsdom does not
 * implement that this app (or Recharts) touches.
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
  // HashRouter keeps the route in window.location.hash, which survives DOM
  // cleanup. Reset it so each test starts on the Analyze route.
  window.location.hash = '';
});

// --- matchMedia -----------------------------------------------------------
// Used by the reduced-motion check and the theme hook.

interface MediaQuery {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: () => void;
  removeListener: () => void;
  addEventListener: () => void;
  removeEventListener: () => void;
  dispatchEvent: () => boolean;
}

/** Tests can flip this to exercise the reduced-motion branch. */
declare global {
  // eslint-disable-next-line no-var
  var __scamlensReducedMotion: boolean | undefined;
}

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string): MediaQuery => ({
    matches: globalThis.__scamlensReducedMotion === true,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// --- scrollIntoView -------------------------------------------------------
// jsdom has no layout engine, so scrolling is a no-op stub.

if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    /* no-op in jsdom */
  };
}

// --- ResizeObserver -------------------------------------------------------
// Recharts' ResponsiveContainer depends on it.

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}

// --- canvas ----------------------------------------------------------------
// html-to-image needs a 2d context; jsdom returns null for it.

if (typeof HTMLCanvasElement.prototype.getContext !== 'function') {
  HTMLCanvasElement.prototype.getContext = function getContext(): null {
    return null;
  };
}
