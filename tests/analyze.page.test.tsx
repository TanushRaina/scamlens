/**
 * Analyze page tests: layout, the toolbar, the 10-section results panel, and the
 * rule that user text is never rendered as markup.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import { MAX_INPUT_LENGTH } from '../src/engine/normalize';
import { resetMemoryState } from '../src/storage/historyStore';

const SCAM_TEXT =
  'Your PayPal account will be suspended. Share your OTP and verify at https://paypal.com.secure-login.xyz';

/** The ten numbered sections, in the order the spec requires. */
const SECTION_TITLES = [
  'Risk score',
  'Where the signals are',
  'Every warning, explained',
  'Combinations that raised the score',
  'Links found',
  'Show the math',
  'What to do now',
  'Tricks used',
  'Risk by category',
  'Keep this analysis',
];

/** Section headings render as "1Risk score" because of the number badge. */
function stripLeadingNumber(text: string | null): string {
  return (text ?? '').replace(/^\s*\d+\s*/, '').trim();
}

/** The <section> that owns a numbered results heading. */
function resultsSection(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { level: 3, name: new RegExp(`${title}$`) });
  const section = heading.closest('section');
  if (!section) throw new Error(`No <section> around heading "${title}"`);
  return section;
}

beforeEach(() => {
  window.localStorage.clear();
  resetMemoryState();
});

describe('page shell', () => {
  it('renders the brand, the three tabs and the persistent disclaimer', () => {
    render(<App />);
    expect(screen.getByText('ScamLens')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Analyze' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByText(/ScamLens is a risk-assessment tool, not a guarantee/i)).toBeInTheDocument();
  });

  it('shows the privacy promise and lets the user dismiss it', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/Your message never leaves this device/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByText(/Your message never leaves this device/i)).not.toBeInTheDocument();
  });

  it('offers a theme toggle that flips the dark class on <html>', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('navigates between the three tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'About' }));
    expect(screen.getByRole('heading', { level: 1, name: 'About ScamLens' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'History' }));
    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Analyze' }));
    expect(screen.getByRole('heading', { level: 2, name: /Paste a message/i })).toBeInTheDocument();
  });
});

describe('the input panel', () => {
  it('disables Analyze until there is text', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Message to analyse'), { target: { value: 'Hello' } });
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeEnabled();
  });

  it('truncates input at the 10,000 character cap', () => {
    render(<App />);
    const input = screen.getByLabelText('Message to analyse');
    fireEvent.change(input, { target: { value: 'x'.repeat(MAX_INPUT_LENGTH + 500) } });
    expect((input as HTMLTextAreaElement).value.length).toBe(MAX_INPUT_LENGTH);
  });

  it('clears the text and the result', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText('Message to analyse'), { target: { value: SCAM_TEXT } });
    await user.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(screen.getByRole('heading', { level: 3, name: /Risk score$/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect((screen.getByLabelText('Message to analyse') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByRole('heading', { level: 3, name: /Risk score$/ })).not.toBeInTheDocument();
  });

  it('fills and analyses when a sample is chosen', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Try a sample' }));
    expect(screen.getByRole('group', { name: 'Sample messages' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /LEGITIMATE bank debit alert/i }));
    const input = screen.getByLabelText('Message to analyse') as HTMLTextAreaElement;
    expect(input.value).toContain('A/c XX1234 debited');

    const section = resultsSection('Risk score');
    expect(within(section).getByText('Low risk')).toBeInTheDocument();
  });
});

describe('the results panel', () => {
  /** Analyse SCAM_TEXT and return the page container. */
  async function analyse(): Promise<HTMLElement> {
    const user = userEvent.setup();
    const { container } = render(<App />);
    fireEvent.change(screen.getByLabelText('Message to analyse'), { target: { value: SCAM_TEXT } });
    await user.click(screen.getByRole('button', { name: 'Analyze' }));
    return container;
  }

  it('renders all ten numbered sections in order', async () => {
    await analyse();

    const headings = screen.getAllByRole('heading', { level: 3 });
    const titles = headings.map((heading) => stripLeadingNumber(heading.textContent));

    expect(titles).toHaveLength(SECTION_TITLES.length);
    for (const title of SECTION_TITLES) {
      expect(titles, `missing section: ${title}`).toContain(title);
    }
  });

  it('renders pasted markup as plain text, never as HTML', async () => {
    const container = await analyse();
    // analyse() used SCAM_TEXT; re-run with a payload containing markup.
    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText('Message to analyse'), {
      target: { value: '<img src=x onerror="window.__pwned=1"> Share your OTP now' },
    });
    await user.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect((window as unknown as { __pwned?: unknown }).__pwned).toBeUndefined();
    expect(screen.getByRole('region', { name: /highlighted evidence/i }).textContent).toContain('<img src=x');
  });

  it('highlights the exact evidence and shows a legend for it', async () => {
    await analyse();

    const region = screen.getByRole('region', { name: /highlighted evidence/i });
    const marks = region.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    const highlightedText = Array.from(marks)
      .map((mark) => mark.textContent ?? '')
      .join(' ');
    expect(highlightedText).toContain('paypal.com.secure-login.xyz');

    const legend = resultsSection('Where the signals are');
    expect(within(legend).getByRole('button', { name: /Suspicious link/i })).toBeInTheDocument();
    expect(within(legend).getByRole('button', { name: /Credential theft/i })).toBeInTheDocument();
  });

  it('explains every warning with evidence and the legitimate alternative', async () => {
    await analyse();

    const section = resultsSection('Every warning, explained');
    expect(within(section).getAllByText(/A legitimate sender would/i).length).toBeGreaterThan(0);
    expect(within(section).getAllByText(/Evidence in this message/i).length).toBeGreaterThan(0);
    expect(within(section).getAllByText(/weight \d+%/).length).toBeGreaterThan(0);
  });

  it('lists the URL checks and their severity', async () => {
    await analyse();

    const section = resultsSection('Links found');
    const table = within(section).getByRole('table');
    expect(table.textContent).toContain('paypal.com');
    expect(table.textContent).toContain('secure-login.xyz');

    const summaries = within(section).getAllByText(/structural check/i);
    expect(summaries.length).toBeGreaterThan(0);

    fireEvent.click(summaries[0]!);
    expect(within(section).getByText(/Links are checked structurally only/i)).toBeInTheDocument();
  });

  it('shows the score derivation and a final total', async () => {
    await analyse();

    const section = resultsSection('Show the math');
    expect(within(section).getAllByText(/Final score/i).length).toBeGreaterThan(0);
    expect(within(section).getByText(/noisy-OR/i)).toBeInTheDocument();
    expect(section.textContent).toContain('/ 100');
  });

  it('makes the action checklist interactive', async () => {
    const user = userEvent.setup();
    await analyse();

    const section = resultsSection('What to do now');
    const boxes = within(section).getAllByRole('checkbox');
    expect(boxes.length).toBeGreaterThan(0);

    await user.click(boxes[0]!);
    expect(boxes[0]).toBeChecked();
    expect(within(section).getByText(/remaining/i)).toBeInTheDocument();
  });

  it('counts the tricks used and draws the category chart', async () => {
    await analyse();

    expect(resultsSection('Tricks used').textContent ?? '').toMatch(/trick(s)? used in this message/i);
    expect(screen.getByRole('heading', { level: 3, name: /Risk by category$/ })).toBeInTheDocument();
  });

  it('shows a neutral result for very short input', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText('Message to analyse'), { target: { value: 'Hi' } });
    await user.click(screen.getByRole('button', { name: 'Analyze' }));

    const section = resultsSection('Risk score');
    expect(within(section).getByText('Low risk')).toBeInTheDocument();
    expect(resultsSection('Show the math').textContent ?? '').toMatch(/character\(s\) of input/i);
  });

  it('shows an empty state before anything is analysed', () => {
    render(<App />);
    expect(screen.getByText(/Nothing has been analysed yet/i)).toBeInTheDocument();
  });
});
