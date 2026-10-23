/**
 * Contact-pattern rules: how the sender wants you to reach *them*.
 *
 * Scammers push victims onto a private channel (WhatsApp, Telegram, a lone
 * number) because those channels have no fraud screening, no verified
 * business identity, and no record you can report to.
 */

import type { Rule } from '../types';

export const contactRules: Rule[] = [
  {
    id: 'whatsapp_contact',
    category: 'contact_pattern',
    label: 'Moves the conversation to WhatsApp',
    weight: 0.25,
    patterns: [
      /\bmessage me on whatsapp\b/g,
      /\bwhatsapp me\b/g,
      /\badd me on whatsapp\b/g,
      /\bchat (?:me|with me) on whatsapp\b/g,
      /\btext me on whatsapp\b/g,
      /\bping me on whatsapp\b/g,
      /\b(?:call|message) me (?:on|via) whatsapp\b/g,
      /\bwhatsapp karo\b/g,
      /\bwhatsapp par\b/g,
    ],
    explanation:
      'Being moved to WhatsApp is a mild signal on its own: many businesses use it, but an unexpected request to continue on a personal chat app is a common scam hand-off.',
    legitimateBehavior:
      'Resolves the issue in the same channel, or gives the verified business number from the official website.',
    advice: 'Verify the business on its official website before chatting.',
  },
  {
    id: 'telegram_contact',
    category: 'contact_pattern',
    label: 'Moves the conversation to Telegram',
    weight: 0.3,
    patterns: [
      /\btelegram\b/g,
      /\bmessage me on telegram\b/g,
      /\bcontact me on telegram\b/g,
      /\bjoin (?:our|my) (?:telegram|whatsapp) (?:group|channel|list)\b/g,
      /\btelegram (?:group|channel|link|chat)\b/g,
      /\btelegram par\b/g,
    ],
    explanation:
      'Telegram is a favourite of fraud rings because accounts are disposable and groups cannot be verified. Any request to continue there deserves scrutiny.',
    legitimateBehavior:
      'Uses its own verified support channels and never asks you to join a group to resolve a personal matter.',
    advice: 'Do not join groups or chat with strangers who contacted you first.',
  },
  {
    id: 'wrong_number_opener',
    category: 'contact_pattern',
    label: 'Opens with a "wrong number" style greeting',
    weight: 0.3,
    patterns: [
      /\bwrong number\b/g,
      /\bhi,? (?:this is )?(?:not |a )?wrong number\b/g,
      /\b(?:hi|hello|hey) (?:this is |i am )?(?:not |no) (?:wrong number|my number|your (?:friend|contact))\b/g,
      /\baap kaun hai\b/g,
      /\bsorry wrong number\b/g,
      /\b(?:hello|hi) (?:wrong|galat) number\b/g,
    ],
    explanation:
      'The "wrong number" opener is used to start a conversation that then turns into a task, investment or romance pitch. It is a low-weight signal but worth noting.',
    legitimateBehavior:
      'A real wrong-number message stops there. It does not become a request for money, OTP or a job.',
    advice: 'If the message turns into a money or OTP request, stop replying.',
  },
  {
    id: 'secrecy_request',
    category: 'contact_pattern',
    label: 'Asks you to keep it secret',
    weight: 0.45,
    patterns: [
      /\bdo not tell (?:anyone|others|your family|your spouse)\b/g,
      /\bdon't tell anyone\b/g,
      /\bdon't (?:share|tell) (?:this|it) (?:with|to|anyone)\b/g,
      /\bkeep (?:this|it) (?:confidential|secret|between us)\b/g,
      /\bconfidential matter\b/g,
      /\bno one (?:should|must|will) know\b/g,
      /\b(?:secret|confidential) (?:mission|work|task|matter)\b/g,
      /\b(?:bato mat|batao mat|kisi ko mat batao)\b/g,
    ],
    explanation:
      'Asking you not to involve anyone else is designed to cut off the one thing that would stop the scam: someone you trust checking it.',
    legitimateBehavior: 'Legitimate notices encourage you to verify and to involve family or your bank.',
    advice: 'Show this message to someone you trust before acting on it.',
  },
  {
    id: 'one_time_contact',
    category: 'contact_pattern',
    label: 'Instructs you to contact only through one channel',
    weight: 0.35,
    patterns: [
      /\bcall (?:me|us) (?:only|just) on (?:whatsapp|telegram|this number|mobile)\b/g,
      /\b(?:we|i) (?:only|just) (?:work|available|reply) (?:on|via|through) (?:whatsapp|telegram|this number)\b/g,
      /\b(?:don't|do not) (?:call|contact|mail) (?:the|our|this) office\b/g,
      /\b(?:reach|contact) me (?:only|just) (?:on|via)\b/g,
      /\b(?:call|contact) (?:karo|mat karo)\b/g,
    ],
    explanation:
      'Cutting you off from official channels is the setup for a live call-centre scammer to take over. Legitimate institutions have no reason to.',
    legitimateBehavior:
      'Gives the official published number and tells you to use it if anything looks wrong.',
    advice: 'Find the official number yourself and call that instead.',
  },
];
