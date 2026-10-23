/**
 * Credential-theft rules: anything that asks for the keys to an account.
 *
 * Weights follow the spec: weak 0.05-0.2, moderate 0.2-0.45, decisive 0.5-0.8.
 * A bare mention of "OTP" is deliberately treated as decisive because, in a
 * cold-contact message, an OTP mention is almost always a request — and a
 * legitimate OTP alert is caught by mitigations.ts instead.
 */

import type { Rule } from '../types';

export const credentialRules: Rule[] = [
  {
    id: 'otp_request',
    category: 'credential_theft',
    label: 'Asks for your OTP / one-time password',
    weight: 0.65,
    patterns: [
      /\botp\b/g,
      /\b(?:one time|single use|one-time) (?:password|passcode|code|token)\b/g,
      /\b(?:6|4|six|four) digit (?:code|otp|pin|number)\b/g,
      /\bmfa (?:code|token|passcode)\b/g,
      /\b(?:otp|pin|cvv) (?:batao|batan|dikhao|send karo|bhij raha|mangta|mang raha|chahiye)\b/g,
      /\b(?:otp|pin) (?:batao|bata do|diyo|dena)\b/g,
    ],
    explanation:
      'An OTP is the last key to your account. A real institution will send you one and tell you to keep it private — it will never ask you to read it out or type it into a page someone else sent you.',
    legitimateBehavior:
      'Sends you an OTP and states clearly that it must not be shared. Never asks for the code to be read back, typed into a link, or sent to another number.',
    advice: 'Do not share the OTP. No bank, UPI app or government office will ever ask for it.',
  },
  {
    id: 'pin_request',
    category: 'credential_theft',
    label: 'Asks for your PIN',
    weight: 0.6,
    patterns: [
      /\bpin code\b/g,
      /\batm pin\b/g,
      /\bcard pin\b/g,
      /\bpin number\b/g,
      /\btransaction pin\b/g,
      /\bshare your pin\b/g,
      /\b(?:pin|password) (?:kya hai|batao|share karo)\b/g,
    ],
    explanation:
      'Your PIN authorises withdrawals. Asking for it — even "to check something" — is asking for direct access to your money.',
    legitimateBehavior:
      'Never asks for your PIN. If a card is blocked it cancels the card or asks you to set a new PIN through the official app or an ATM.',
    advice: 'Treat any PIN request as a live attack on your money.',
  },
  {
    id: 'password_request',
    category: 'credential_theft',
    label: 'Asks for your password or login',
    weight: 0.6,
    patterns: [
      /\bpassword\b/g,
      /\bpasscode\b/g,
      /\baccount password\b/g,
      /\blogin password\b/g,
      /\bshare (?:your|the|a) password\b/g,
      /\bpassword (?:kya hai|batao|share karo)\b/g,
    ],
    explanation:
      'Passwords are never needed to "verify" you over a message. A request for one is a credential-harvesting attempt.',
    legitimateBehavior:
      'If it genuinely needs to reset access it sends a time-limited reset link to your registered address and never asks you to reveal the password.',
    advice: 'Never type a password into a page you were sent in a message.',
  },
  {
    id: 'card_details_request',
    category: 'credential_theft',
    label: 'Asks for card details',
    weight: 0.55,
    patterns: [
      /\bcvv\b/g,
      /\bcvc\b/g,
      /\bcard verification (?:value|number)\b/g,
      /\b16[-\s]?digit (?:card|number|code)\b/g,
      /\bcredit card (?:number|details|info)\b/g,
      /\b(?:credit|debit) card number\b/g,
      /\bcard number\b/g,
      /\b(?:debit|credit) card (?:details|info)\b/g,
      /\bcard expiry\b/g,
      /\b(?:card|debit) details\b/g,
    ],
    explanation:
      'Card number, expiry and CVV together let a fraudster charge your card. No payment network ever requires the CVV to be read out to anyone.',
    legitimateBehavior:
      'Charges you through a regulated payment page and never asks for the CVV, full card number or a photo of the card by message or call.',
    advice: 'Hang up and call the number printed on the back of your card.',
  },
  {
    id: 'aadhaar_request',
    category: 'credential_theft',
    label: 'Asks for your Aadhaar number',
    weight: 0.55,
    patterns: [
      /\baadhaar\b/g,
      /\baadhar\b/g,
      /\buid (?:number|card|details)\b/g,
      /\b(?:12[-\s]?digit|12 digit) aadhaar\b/g,
      /\bshare (?:your|the|a) aadhaar\b/g,
      /\baadhaar (?:number|card|details) (?:kya hai|batao|share karo)\b/g,
    ],
    explanation:
      'An Aadhaar number is a master identifier — with it a fraudster can open accounts and take loans in your name.',
    legitimateBehavior:
      'A government or bank form may collect it for a genuine KYC, but only on an official portal you navigated to yourself, never in a chat or by phone call.',
    advice: 'Verify the request on the official UIDAI portal before sharing anything.',
  },
  {
    id: 'pan_request',
    category: 'credential_theft',
    label: 'Asks for your PAN',
    weight: 0.5,
    patterns: [
      /\bpan card\b/g,
      /\bpan number\b/g,
      /\bpan details\b/g,
      /\bshare (?:your|the|a) pan\b/g,
      /\bupdate (?:your|the|a)? pan\b/g,
      /\bpan card update\b/g,
      /\b(?:share|send|submit) (?:your|the) pan\b/g,
    ],
    explanation:
      'PAN is required for tax and banking identity. Scammers use "update your PAN" to harvest it for fake loans and filings.',
    legitimateBehavior:
      'Income Tax and banks never ask for PAN by message or call, and never ask you to pay a fee to "update" it.',
    advice: 'Do the PAN update only on the official Income Tax e-filing site.',
  },
  {
    id: 'screen_share_request',
    category: 'credential_theft',
    label: 'Asks to share your screen / install remote-access software',
    weight: 0.7,
    patterns: [
      /\b(?:anydesk|any desk|teamviewer|quicksupport|join\.me|screenhero|zoho assist)\b/g,
      /\bscreen share\b/g,
      /\bshare your screen\b/g,
      /\bremote (?:access|control|support|assistance)\b/g,
      /\binstall (?:anydesk|teamviewer|quicksupport)\b/g,
      /\b(?:anydesk|teamviewer) (?:app|id|meeting|code|id)\b/g,
      /\b(?:screen|remote) share (?:karo|karke|karoge)\b/g,
    ],
    explanation:
      'Screen sharing hands a stranger live control of your phone or computer. With that they can read the OTP that arrives on your device and complete the transaction themselves.',
    legitimateBehavior:
      'No bank, retailer or government office will ever ask you to install remote-access software or share your screen.',
    advice: 'Refuse and hang up immediately. Do not install any app they name.',
  },
  {
    id: 'account_verify_request',
    category: 'credential_theft',
    label: 'Asks you to "verify your account"',
    weight: 0.45,
    patterns: [
      /\bverify your account\b/g,
      /\baccount verification\b/g,
      /\bconfirm your account\b/g,
      /\bverify your identity\b/g,
      /\bconfirm your identity\b/g,
      /\baccount (?:ko|ko hi) verify karo\b/g,
      /\bidentity verification\b/g,
    ],
    explanation:
      '"Verify your account" is a common pretext for sending you to a fake login page that harvests credentials.',
    legitimateBehavior:
      "Verification happens inside the official app or on the institution's own website, which you navigate to yourself — never via a link in a message.",
    advice: 'Open the official app instead of tapping any link in the message.',
  },
  {
    id: 'login_to_confirm',
    category: 'credential_theft',
    label: 'Asks you to log in to "confirm" something',
    weight: 0.45,
    patterns: [
      /\blogin to (?:confirm|verify|validate|activate|update)\b/g,
      /\blog in to (?:confirm|verify|validate|activate)\b/g,
      /\bclick to (?:confirm|verify|validate|activate)\b/g,
      /\bsign in to (?:confirm|verify|validate)\b/g,
      /\b(?:login|log in) karke (?:confirm|verify) karo\b/g,
      /\b(?:login|log in) (?:karo|karke)\b/g,
    ],
    explanation:
      'Being asked to log in from inside a message means the login page belongs to the sender, not your bank. That is exactly where stolen passwords end up.',
    legitimateBehavior:
      'Sends a notification that something needs attention and lets you open the official app yourself.',
    advice: 'Close the message and open the app from your home screen.',
  },
  {
    id: 'kyc_document_request',
    category: 'credential_theft',
    label: 'Asks you to send KYC documents',
    weight: 0.45,
    patterns: [
      /\bkyc documents\b/g,
      /\bkyc document\b/g,
      /\bshare your (?:kyc|aadhaar|pan|id proof|selfie)\b/g,
      /\bupload (?:your|the) kyc\b/g,
      /\bkyc (?:photo|document|details|copy|front|back)\b/g,
      /\bsend (?:your|the) kyc\b/g,
      /\bshare kyc\b/g,
      /\bkyc photos\b/g,
    ],
    explanation:
      'Documents handed to a stranger give them the identity proof needed to open accounts, take loans or change your SIM — all in your name.',
    legitimateBehavior:
      'KYC is collected only through the official app, a verified call centre number, or a branch visit you arranged yourself.',
    advice: 'Do not send identity photos or documents to anyone who contacted you first.',
  },
];
