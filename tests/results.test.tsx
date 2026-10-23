/**
 * Results panel behaviour that the page-level tests do not reach: combination
 * alerts, mitigation notes, and the save / copy / download controls.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { toPng } = vi.hoisted(() => ({
  toPng: vi.fn(async () => 'data:image/png;base64,iVBORw0KGgo='),
}));

vi.mock('html-to-image', () => ({ toPng }));

import { App } from '../src/App';
import { STORAGE_KEY, resetMemoryState } from '../src/storage/historyStore';

const COMBO_TEXT = 'Your account will be blocked. Share your OTP to verify and pay the fee to release it.';

/**
 * Analyse `text`. Uses fireEvent rather than userEvent because userEvent.setup()
 * installs its own clipboard stub, which would hide the spy the copy test needs.
 */
function analyse(text: string): void {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Message to analyse'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
}

beforeEach(() => {
  window.localStorage.clear();
  resetMemoryState();
  toPng.mockClear();
  toPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
});

describe('combination alerts', () => {
  it('names the categories that combined and what that usually means', async () => {
    await analyse(COMBO_TEXT);

    const section = screen
      .getByRole('heading', { level: 3, name: /Combinations that raised the score$/ })
      .closest('section')!;
    const alerts = within(section).getAllByText(/^\+?\d+%$/);
    expect(alerts.length).toBeGreaterThan(0);
    expect(section.textContent ?? '').toMatch(/combination|combined/i);
  });

  it('reports mitigations that lowered the score', async () => {
    await analyse('Your OTP is 482913. Bank will never ask for this OTP. Do not share it with anyone.');

    const section = screen
      .getByRole('heading', { level: 3, name: /Every warning, explained$/ })
      .closest('section')!;
    expect(within(section).getAllByText(/Downgraded:/i).length).toBeGreaterThan(0);
  });
});

describe('save, copy and download', () => {
  it('saves to history and confirms it', async () => {
    const user = userEvent.setup();

    await analyse(COMBO_TEXT);
    await user.click(screen.getByRole('button', { name: /Save to history/i }));

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').scans).toHaveLength(1);
  });

  it('masks personal data before saving', async () => {
    const user = userEvent.setup();

    await analyse('Call me on 9876543210 to release your parcel.');
    await user.click(screen.getByRole('button', { name: /Save to history/i }));

    await waitFor(() => expect(screen.getByText(/personal data masked/i)).toBeInTheDocument());
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.scans[0]?.inputText).not.toContain('9876543210');
  });

  it('copies the analysis JSON to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await analyse(COMBO_TEXT);
    await user.click(screen.getByRole('button', { name: /Copy JSON/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const payload = writeText.mock.calls[0]?.[0] ?? '';
    expect(JSON.parse(payload)).toHaveProperty('score');
    await waitFor(() => expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument());
  });

  it('downloads a PNG snapshot of the results panel', async () => {
    const user = userEvent.setup();
    const clicks: string[] = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement): void {
      clicks.push(this.download);
    };

    try {
      await analyse(COMBO_TEXT);
      await user.click(screen.getByRole('button', { name: 'Download' }));

      await waitFor(() => expect(toPng).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(clicks.length).toBeGreaterThan(0));
      expect(clicks[0]).toMatch(/^scamlens-.*\.png$/);
      await waitFor(() => expect(screen.getByText(/PNG snapshot/i)).toBeInTheDocument());
    } finally {
      HTMLAnchorElement.prototype.click = originalClick;
    }
  });

  it('falls back to a JSON download when the image capture fails', async () => {
    const user = userEvent.setup();
    toPng.mockRejectedValueOnce(new Error('no canvas'));
    const clicks: string[] = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement): void {
      clicks.push(this.download);
    };

    try {
      await analyse(COMBO_TEXT);
      await user.click(screen.getByRole('button', { name: 'Download' }));

      await waitFor(() => expect(clicks.length).toBeGreaterThan(0));
      expect(clicks[0]).toMatch(/^scamlens-.*\.json$/);
      await waitFor(() => expect(screen.getByText(/downloaded the JSON instead/i)).toBeInTheDocument());
    } finally {
      HTMLAnchorElement.prototype.click = originalClick;
    }
  });
});
