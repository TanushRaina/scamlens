/**
 * The privacy promise banner.
 *
 * Dismissible — once dismissed it stays dismissed for this browser. The rest of
 * the app never relies on it: the disclaimer in the footer is always present.
 */

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'scamlens:privacy-dismissed';

function isDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function PrivacyBanner(): JSX.Element | null {
  const [visible, setVisible] = useState<boolean>(() => !isDismissed());

  useEffect(() => {
    if (!visible) {
      try {
        window.localStorage.setItem(DISMISS_KEY, '1');
      } catch {
        // Storage unavailable: the banner simply stays dismissible in memory.
      }
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div role="status" className="mx-auto max-w-6xl px-4 pt-4">
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/60">
        <span aria-hidden="true" className="text-lg">
          🔒
        </span>
        <p className="flex-1 text-emerald-900 dark:text-emerald-100">
          <strong className="font-semibold">Your message never leaves this device.</strong> ScamLens runs
          entirely in your browser. Nothing is sent to a server, no analytics, no trackers, and no network
          request is made while analysing.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-lg border border-emerald-300 px-3 py-1 font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
