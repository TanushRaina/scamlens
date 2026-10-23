/**
 * Language-quality rules.
 *
 * These are deliberately the weakest signals in the engine: capitalisation,
 * exclamation marks and emoji also appear in genuine messages. They exist to
 * add texture and to help explain *how* a scam message was built, not to
 * decide anything on their own. They read the raw text because the folded
 * layers are lowercased and would hide exactly what they need to see.
 */

import type { Rule } from '../types';

export const languageRules: Rule[] = [
  {
    id: 'excessive_caps',
    category: 'language_quality',
    label: 'Large blocks of capital letters',
    weight: 0.1,
    patterns: [/[A-Z]{5,}/g],
    explanation:
      'Lots of capital letters is a shout. Legitimate companies use sentence case; scam messages shout to substitute for credibility.',
    legitimateBehavior: 'Uses normal typography, with capitals only for proper nouns.',
    advice: 'Read calmly — the shouting is not the reason to act.',
    rawOnly: true,
  },
  {
    id: 'excessive_exclamation',
    category: 'language_quality',
    label: 'Many exclamation marks',
    weight: 0.12,
    patterns: [/[!！]{3,}/g],
    explanation:
      'Stacked exclamation marks are used to manufacture excitement and panic. Real notifications are neutral in tone.',
    legitimateBehavior: 'Uses one exclamation mark at most, or none.',
    advice: 'The tone is part of the trick, not part of the news.',
    rawOnly: true,
  },
  {
    id: 'heavy_emoji_money',
    category: 'language_quality',
    label: 'Money emoji used as decoration',
    weight: 0.08,
    patterns: [/(?:💰|💸|🤑|💵|💴|💶|💷|🪙|💎|🎁|🧧|🤵|🤴|🏦|📈){2,}/gu],
    explanation:
      'Money and gift emoji are decoration used to make a money pitch look friendly. They add nothing to a real bank alert.',
    legitimateBehavior: 'Uses plain text, or emoji only where they have a genuine meaning.',
    advice: 'Treat emoji-decorated money offers with suspicion.',
    rawOnly: true,
  },
  {
    id: 'odd_spacing',
    category: 'language_quality',
    label: 'Odd spacing or line breaks',
    weight: 0.15,
    patterns: [/[^\S\n]{2,}/g, /\n{3,}/g, /\t{2,}/g],
    explanation:
      'Unusual whitespace is often used to hide a word from spam filters, or to mimic the layout of a genuine alert.',
    legitimateBehavior: "Normal sentence spacing, produced by the sender's own messaging system.",
    advice: 'Odd formatting is another reason to verify independently.',
    rawOnly: true,
  },
];
