/**
 * History page tests: save, list, reopen, delete, clear, and the empty state.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { MAX_INPUT_LENGTH } from '../src/engine/normalize';
import { STORAGE_KEY, resetMemoryState } from '../src/storage/historyStore';

const SCAM_TEXT =
  'Your PayPal account will be suspended. Share your OTP and verify at https://paypal.com.secure-login.xyz';
const SECOND_TEXT = 'Work from home. Earn Rs 5000 per day. Join our Telegram group.';

async function analyseAndSave(text: string): Promise<void> {
  const user = userEvent.setup();
  fireEvent.change(screen.getByLabelText('Message to analyse'), { target: { value: text } });
  await user.click(screen.getByRole('button', { name: 'Analyze' }));
  await user.click(screen.getByRole('button', { name: /Save to history/i }));
}

beforeEach(() => {
  window.localStorage.clear();
  resetMemoryState();
});

describe('history page', () => {
  it('shows an empty state when nothing has been saved', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'History' }));
    expect(screen.getByText(/No scans saved yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Analyze/i })).toBeInTheDocument();
  });

  it('persists a saved scan in localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await analyseAndSave(SCAM_TEXT);
    await user.click(screen.getByRole('link', { name: 'History' }));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.scans).toHaveLength(1);
    expect(stored.scans[0]?.inputText).toBe(SCAM_TEXT);
  });

  it('lists saved scans with their verdict and a preview', async () => {
    const user = userEvent.setup();
    render(<App />);

    await analyseAndSave(SCAM_TEXT);
    await analyseAndSave(SECOND_TEXT);
    await user.click(screen.getByRole('link', { name: 'History' }));

    const page = screen.getByRole('heading', { level: 1, name: 'History' }).closest('div')!;
    expect(within(page).getByText(/saved on this device/i)).toBeInTheDocument();
    expect(within(page).getAllByRole('button', { name: 'Reopen' })).toHaveLength(2);
    expect(page.textContent).toContain('paypal.com.secure-login.xyz');
  });

  it('reopens a saved scan on the Analyze page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await analyseAndSave(SCAM_TEXT);
    await user.click(screen.getByRole('link', { name: 'History' }));
    await user.click(screen.getByRole('button', { name: 'Reopen' }));

    const input = screen.getByLabelText('Message to analyse') as HTMLTextAreaElement;
    expect(input.value).toBe(SCAM_TEXT);
    expect(screen.getByRole('heading', { level: 3, name: /Risk score$/ })).toBeInTheDocument();
  });

  it('deletes a single scan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await analyseAndSave(SCAM_TEXT);
    await user.click(screen.getByRole('link', { name: 'History' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText(/No scans saved yet/i)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').scans).toHaveLength(0);
  });

  it('clears every scan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await analyseAndSave(SCAM_TEXT);
    await analyseAndSave(SECOND_TEXT);
    await user.click(screen.getByRole('link', { name: 'History' }));

    await user.click(screen.getByRole('button', { name: /Clear all/i }));
    expect(screen.getByText(/No scans saved yet/i)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').scans).toHaveLength(0);
  });

  it('shows a warning when storage is unavailable', async () => {
    const user = userEvent.setup();
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
        removeItem: () => {
          throw new Error('blocked');
        },
        clear: () => {
          throw new Error('blocked');
        },
        key: () => null,
        length: 0,
      },
      configurable: true,
    });

    try {
      render(<App />);
      await user.click(screen.getByRole('link', { name: 'History' }));
      expect(screen.getByText(/storage disabled/i)).toBeInTheDocument();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
      else delete (window as unknown as Record<string, unknown>).localStorage;
    }
  });

  it('caps stored text at the analysis limit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await analyseAndSave('x'.repeat(MAX_INPUT_LENGTH + 400));
    await user.click(screen.getByRole('link', { name: 'History' }));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.scans[0]?.inputText.length).toBe(MAX_INPUT_LENGTH);
  });
});
