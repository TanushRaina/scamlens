/**
 * Engine unit tests.
 *
 * Every static rule is exercised with at least one positive case (it fires) and
 * one negative case (it does not). Normalization and highlight-offset behaviour
 * is tested separately at the bottom.
 */

import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { normalize, layerToOriginal, MAX_INPUT_LENGTH } from '../src/engine/normalize';
import { RULES, RULE_IDS } from '../src/engine/rules';
import { segmentsForRender, mergeRanges, CATEGORY_PRIORITY } from '../src/engine/highlight';
import type { Finding } from '../src/engine/types';

function analyzeOnce(text: string) {
  return analyze(text, { now: 0, id: 'test' });
}

function ruleIds(text: string): string[] {
  return analyzeOnce(text).findings.map((f) => f.ruleId);
}

function hasRule(text: string, id: string): boolean {
  return ruleIds(text).includes(id);
}

/** Rule id -> texts that must trigger it. */
const POSITIVE: Record<string, string[]> = {
  otp_request: ['Share your OTP now', 'Please confirm the one time password'],
  pin_request: ['Share your PIN', 'What is your ATM pin code?'],
  password_request: ['Enter your password to continue'],
  card_details_request: ['Send us your CVV and card number'],
  aadhaar_request: ['Share your Aadhaar number'],
  pan_request: ['Update your PAN card today'],
  screen_share_request: ['Install AnyDesk so we can help'],
  account_verify_request: ['Please verify your account'],
  login_to_confirm: ['Login to confirm your identity'],
  kyc_document_request: ['Send us your KYC documents'],

  within_24h: ['Action required within 24 hours'],
  immediately_act: ['You must act immediately'],
  account_suspended: ['Your account will be blocked'],
  last_warning: ['This is the last warning'],
  legal_action: ['Legal action will be taken'],
  arrest_threat: ['You will be arrested'],
  sim_deactivate: ['Your SIM will be deactivated'],
  expires_today: ['The offer expires today'],

  won_prize: ['You have won a prize'],
  lottery_claim: ['Claim your lottery winnings'],
  guaranteed_returns: ['We offer guaranteed returns'],
  double_money: ['We will double your money'],
  easy_income: ['Easy work from home income'],
  reward_claim: ['Claim your reward now'],
  loan_approval_easy: ['Apply for an instant loan'],
  cashback_offer: ['Flat cashback of 100%'],
  investment_pitch: ['Invest now in crypto trading'],
  fake_refund_offer: ['An extra refund is pending'],

  bank_impersonation: ['This is your bank calling'],
  rbi_impersonation: ['This is RBI'],
  income_tax_impersonation: ['Income Tax department notice'],
  courier_impersonation: ['Calling from DHL'],
  telecom_impersonation: ['We are from Airtel: your connection will be cut.'],
  ecommerce_impersonation: ['Amazon support team'],
  gov_scheme_impersonation: ['This government scheme will help'],
  tech_support_impersonation: ['Windows tech support'],
  customer_care_generic: ['Call our customer care number'],

  gift_card_payment: ['Pay by Amazon gift card'],
  crypto_payment: ['Send us Bitcoin'],
  wire_transfer: ['Send the money by wire transfer'],
  fee_to_release: ['Pay a small fee to release your parcel'],
  processing_fee: ['A processing fee is required'],
  refundable_deposit: ['Pay a refundable deposit'],

  whatsapp_contact: ['Message me on WhatsApp'],
  telegram_contact: ['Join our Telegram group'],
  wrong_number_opener: ['Hi, wrong number'],
  secrecy_request: ['Do not tell anyone'],
  one_time_contact: ['Call me only on WhatsApp'],

  excessive_caps: ['THIS IS VERY IMPORTANT'],
  excessive_exclamation: ['WOW!!!'],
  heavy_emoji_money: ['💰💸🤑'],
  odd_spacing: ['Hello   there'],

  upi_collect_in: ['Accept the UPI collect request'],
  kyc_pending_in: ['Your KYC is pending'],
  pan_update_required: ['PAN card update required'],
  bill_disconnection: ['The connection will be disconnected'],
  bill_mention: ['Your electricity bill is due'],
  fastag_challan: ['FASTag challan payment pending'],
  fake_job_task: ['Apply for a part time job'],
  digital_arrest_in: ['A digital arrest warrant has been issued'],
  customs_parcel: ['Your parcel is held at customs'],
  loan_app_threat: ['A loan recovery agent will visit'],
  hinglish_urgency: ['Turrant karo abhi'],
  hinglish_money: ['Paisa kamao ghar baithe'],
  hinglish_click: ['Link par click karo'],
};

/** Rule id -> texts that must NOT trigger it. */
const NEGATIVE: Record<string, string[]> = {
  otp_request: ['Your card will arrive within five working days.'],
  pin_request: ['Your debit card has been blocked after 3 failed PIN attempts.'],
  password_request: ['Please update your profile in the official app.'],
  card_details_request: ['Your credit card bill of Rs 12,500 is due on 25 Oct.'],
  aadhaar_request: ['Your KYC is verified and active.'],
  pan_request: ['Income Tax refund of Rs 12,000 has been credited.'],
  screen_share_request: ['Please visit our branch for assistance.'],
  account_verify_request: ['Your statement is ready in the app.'],
  login_to_confirm: ['Open the app to check your balance.'],
  kyc_document_request: ['Complete your KYC to continue using your account.'],

  within_24h: ['The payment is due on 28 October.'],
  immediately_act: ['Let me know when you are free.'],
  account_suspended: ['Your account has been credited with Rs 500.'],
  last_warning: ['Here is your monthly statement.'],
  legal_action: ['Please find the refund receipt attached.'],
  arrest_threat: ['The police station is two blocks away.'],
  sim_deactivate: ['Your recharge of Rs 299 was successful.'],
  expires_today: ['Your subscription renews next month.'],

  won_prize: ['Did you watch the match? We won 3-1.'],
  lottery_claim: ['The draw results are published on the website.'],
  guaranteed_returns: ['Investments carry risk and returns are not assured.'],
  double_money: ['Your savings account earns 3% interest.'],
  easy_income: ['I am looking for a full time job.'],
  reward_claim: ['Your loyalty points are visible in the app.'],
  loan_approval_easy: ['Your loan of Rs 5,00,000 has been approved.'],
  cashback_offer: ['Your Netflix subscription of Rs 499 was charged.'],
  investment_pitch: ['Please read the mutual fund fact sheet.'],
  fake_refund_offer: ['The merchant refunded Rs 900 automatically.'],

  bank_impersonation: ['We will never ask for your OTP, PIN or password.'],
  rbi_impersonation: ['The financial regulator published a circular today.'],
  income_tax_impersonation: ['Income Tax refund of Rs 12,000 has been credited.'],
  courier_impersonation: ['Your parcel will be delivered today.'],
  telecom_impersonation: ['Your Airtel recharge of Rs 299 is successful.'],
  ecommerce_impersonation: ['Rs 500 paid to Amazon. Order delivered.'],
  gov_scheme_impersonation: ['PMAY subsidy of Rs 2,00,000 has been credited.'],
  tech_support_impersonation: ['Your antivirus is up to date.'],
  customer_care_generic: ['Reply STOP to unsubscribe.'],

  gift_card_payment: ['Pay by card or net banking.'],
  crypto_payment: ['The invoice total is Rs 1,200.'],
  wire_transfer: ['The refund will appear in your account.'],
  fee_to_release: ['No payment is required for this service.'],
  processing_fee: ['There is no fee for this transaction.'],
  refundable_deposit: ['The deposit was returned in full.'],

  whatsapp_contact: ['Please check your registered email.'],
  telegram_contact: ['The update will arrive by post.'],
  wrong_number_opener: ['Hello, this is the branch manager.'],
  secrecy_request: ['Please share this with your family.'],
  one_time_contact: ['You can reach us on the official number.'],

  excessive_caps: ['Your account is fine, thank you.'],
  excessive_exclamation: ['The statement is ready.'],
  heavy_emoji_money: ['Please review the attached statement.'],
  odd_spacing: ['Normal sentence spacing here.'],

  upi_collect_in: ['You paid Rs 200 to a local merchant.'],
  kyc_pending_in: ['Complete your KYC to continue using your account.'],
  pan_update_required: ['Your PAN is already linked.'],
  bill_disconnection: ['Your electricity bill of Rs 2,100 is due on 28 Oct.'],
  bill_mention: ['The ticket charge is Rs 1,200.'],
  fastag_challan: ['Your toll gate is open today.'],
  fake_job_task: ['I start my new job on Monday.'],
  digital_arrest_in: ['The nearest bank branch is two kilometres away.'],
  customs_parcel: ['Your parcel is out for delivery.'],
  loan_app_threat: ['Your loan EMI is due on the 5th.'],
  hinglish_urgency: ['Aap abhi ghar aao.'],
  hinglish_money: ['Main paisa khud kama raha hoon.'],
  hinglish_click: ['Please open the app.'],
};

describe('rule registry', () => {
  it('has at least 45 rules with unique ids and categories', () => {
    expect(RULES.length).toBeGreaterThanOrEqual(45);
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  it('every rule has a weight inside the documented band', () => {
    for (const rule of RULES) {
      expect(rule.weight).toBeGreaterThan(0);
      expect(rule.weight).toBeLessThanOrEqual(0.8);
      expect(rule.patterns.length).toBeGreaterThan(0);
      expect(rule.patterns.length).toBeLessThanOrEqual(10);
      expect(rule.label.length).toBeGreaterThan(3);
      expect(rule.explanation.length).toBeGreaterThan(20);
      expect(rule.legitimateBehavior.length).toBeGreaterThan(20);
    }
  });

  it('every pattern is global so offsets can be captured', () => {
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        expect(pattern.flags).toContain('g');
      }
    }
  });

  it('every rule is covered by the positive/negative tables', () => {
    const missing = RULE_IDS.filter((id) => !POSITIVE[id] || !NEGATIVE[id]);
    expect(missing).toEqual([]);
  });
});

describe('rule positive cases', () => {
  for (const [ruleId, texts] of Object.entries(POSITIVE)) {
    it(`${ruleId} fires`, () => {
      for (const text of texts) {
        expect(hasRule(text, ruleId), `expected ${ruleId} in: ${text}`).toBe(true);
      }
    });
  }
});

describe('rule negative cases', () => {
  for (const [ruleId, texts] of Object.entries(NEGATIVE)) {
    it(`${ruleId} does not fire`, () => {
      for (const text of texts) {
        expect(hasRule(text, ruleId), `expected no ${ruleId} in: ${text}`).toBe(false);
      }
    });
  }
});

describe('every rule has a unique regex-safe pattern set', () => {
  it('patterns are not nested-quantifier heavy', () => {
    // A cheap guard: no pattern may contain "(...+...)+" or "(...*...)*" shapes.
    const dangerous = /\([^)]*[+*]\)[+*]/;
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        expect(dangerous.test(pattern.source), `${rule.id}: ${pattern.source}`).toBe(false);
      }
    }
  });
});

describe('normalization', () => {
  it('strips zero-width characters and reports them', () => {
    const result = normalize('pay\u200bpal');
    expect(result.deobfuscated.text).toBe('paypal');
    expect(result.obfuscations.some((o) => o.kind === 'zero_width')).toBe(true);
  });

  it('folds Cyrillic homoglyphs to Latin', () => {
    const result = normalize('p\u0430yp\u0430l');
    expect(result.deobfuscated.text).toBe('paypal');
    expect(result.obfuscations.some((o) => o.kind === 'homoglyph')).toBe(true);
  });

  it('folds Greek homoglyphs to Latin', () => {
    expect(normalize('\u03c1\u03c1\u03c4\u03b1\u03bb').deobfuscated.text).toBe('pptal');
  });

  it('folds fullwidth characters', () => {
    expect(normalize('\uff21\uff22\uff23').deobfuscated.text).toBe('abc');
  });

  it('folds leetspeak digits', () => {
    expect(normalize('p4yp4l').deobfuscated.text).toBe('paypal');
    expect(normalize('paypa1').deobfuscatedAlt.text).toBe('paypal');
  });

  it('collapses spaced-out letters into one word', () => {
    const result = normalize('P a y p a l');
    expect(result.deobfuscated.text).toBe('paypal');
    expect(result.obfuscations.some((o) => o.kind === 'spaced_letters')).toBe(true);
  });

  it('collapses repeated characters in the compressed layer', () => {
    expect(normalize('ppppaypal').compressed.text).toBe('paypal');
  });

  it('does not collapse ordinary words in the compressed layer', () => {
    expect(normalize('important').compressed.text).toBe('important');
  });

  it('keeps offsets pointing into the original text after folding', () => {
    const original = 'Your acc\u043eunt will be blocked';
    const result = normalize(original);
    const start = result.deobfuscated.text.indexOf('account');
    const mapped = layerToOriginal(result.deobfuscated, start, start + 'account'.length);
    expect(original.slice(mapped.start, mapped.end)).toBe('acc\u043eunt');
  });

  it('keeps offsets valid after removing zero-width characters', () => {
    const original = 'a\u200bbc';
    const result = normalize(original);
    const mapped = layerToOriginal(result.deobfuscated, 0, 3);
    expect(original.slice(mapped.start, mapped.end)).toBe('a\u200bbc');
  });

  it('truncates input to the maximum length', () => {
    const long = 'a'.repeat(MAX_INPUT_LENGTH + 500);
    expect(normalize(long).original.length).toBe(MAX_INPUT_LENGTH);
  });
});

describe('highlights', () => {
  it('merges overlapping ranges keeping the higher-weight category', () => {
    const merged = mergeRanges([
      { start: 0, end: 5, category: 'language_quality', ruleId: 'a', weight: 0.1 },
      { start: 3, end: 8, category: 'credential_theft', ruleId: 'b', weight: 0.6 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ start: 0, end: 8, category: 'credential_theft' });
  });

  it('keeps the higher-priority category when weights are equal', () => {
    const merged = mergeRanges([
      { start: 0, end: 4, category: 'regional', ruleId: 'a', weight: 0.5 },
      { start: 2, end: 6, category: 'credential_theft', ruleId: 'b', weight: 0.5 },
    ]);
    expect(merged[0]?.category).toBe('credential_theft');
    expect(CATEGORY_PRIORITY.credential_theft).toBeGreaterThan(CATEGORY_PRIORITY.regional);
  });

  it('does not merge adjacent-but-distinct ranges incorrectly', () => {
    const merged = mergeRanges([
      { start: 0, end: 2, category: 'urgency', ruleId: 'a', weight: 0.4 },
      { start: 5, end: 7, category: 'urgency', ruleId: 'b', weight: 0.4 },
    ]);
    expect(merged).toHaveLength(2);
  });

  it('produces segments that cover the whole text without overlap', () => {
    const text = 'Share your OTP now';
    const result = analyzeOnce(text);
    const segments = segmentsForRender(text, result.highlights);
    const joined = segments.map((s) => s.text).join('');
    expect(joined).toBe(text);

    let cursor = 0;
    for (const segment of segments) {
      const offset = text.indexOf(segment.text, cursor);
      expect(offset).toBe(cursor);
      cursor += segment.text.length;
    }
    expect(cursor).toBe(text.length);
  });

  it('highlight offsets survive obfuscation', () => {
    const text = 'P a y p a l security: share your OTP';
    const result = analyzeOnce(text);
    expect(result.highlights.length).toBeGreaterThan(0);
    for (const highlight of result.highlights) {
      expect(highlight.start).toBeGreaterThanOrEqual(0);
      expect(highlight.end).toBeLessThanOrEqual(text.length);
      expect(highlight.end).toBeGreaterThan(highlight.start);
    }
    // Every highlight must resolve to non-empty original text.
    for (const highlight of result.highlights) {
      expect(text.slice(highlight.start, highlight.end).length).toBeGreaterThan(0);
    }
  });
});

describe('analyze integration', () => {
  it('returns a neutral result for empty or very short input', () => {
    for (const text of ['', '   ', 'ok', 'hi']) {
      const result = analyzeOnce(text);
      expect(result.insufficientInput).toBe(true);
      expect(result.score).toBe(0);
      expect(result.verdict).toBe('low');
      expect(result.findings).toEqual([]);
    }
  });

  it('marks obfuscation as a finding and highlights it', () => {
    const result = analyzeOnce('P a y p a l: share your OTP');
    const obfuscation = result.findings.find((f) => f.ruleId === 'obfuscated_text');
    expect(obfuscation).toBeDefined();
    expect(obfuscation?.matches.length).toBeGreaterThan(0);
  });

  it('flags a URL that impersonates a brand', () => {
    const result = analyzeOnce('Verify at https://paypal.com.secure-login.xyz');
    expect(result.urls).toHaveLength(1);
    expect(result.urls[0]?.suspicious).toBe(true);
    expect(result.urls[0]?.checks.some((c) => c.id === 'brand_not_in_domain')).toBe(true);
  });

  it('treats an exact known domain as trusted', () => {
    const result = analyzeOnce('Track your order at https://www.delhivery.com/t/ABC');
    expect(result.urls[0]?.trusted).toBe(true);
    expect(result.urls[0]?.suspicious).toBe(false);
    expect(result.urls[0]?.score).toBe(0);
  });

  it('sets inputType to url when the whole input is a link', () => {
    const result = analyzeOnce('https://paypal.com.secure-login.xyz');
    expect(result.inputType).toBe('url');
  });

  it('produces actions and educational tricks', () => {
    const result = analyzeOnce('Share your OTP or your account will be blocked.');
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.some((a) => a.toLowerCase().includes('otp'))).toBe(true);
    expect(result.tricks.length).toBeGreaterThan(0);
  });

  it('always exposes a score derivation', () => {
    const result = analyzeOnce('Your account will be blocked. Share your OTP.');
    expect(result.scoreTerms.length).toBeGreaterThan(1);
    const last = result.scoreTerms[result.scoreTerms.length - 1];
    expect(last.source).toBe('noisy-or');
    expect(last.weight).toBeGreaterThan(0);
  });

  it('never leaves a finding without an explanation', () => {
    const result = analyzeOnce(
      'Your account will be blocked. Share your OTP. Pay via gift card. Click http://paypal.com.secure-login.xyz',
    );
    expect(result.findings.length).toBeGreaterThan(0);
    for (const finding of result.findings) {
      expect(finding.explanation.length).toBeGreaterThan(20);
      expect(finding.legitimateBehavior.length).toBeGreaterThan(20);
      expect(finding.label.length).toBeGreaterThan(3);
    }
  });

  it('marks mitigated findings and explains the reason', () => {
    const result = analyzeOnce('Your OTP is 482913. Do not share this OTP with anyone.');
    const mitigated = result.findings.filter((f) => f.mitigated);
    expect(mitigated.length).toBeGreaterThan(0);
    for (const finding of mitigated) {
      expect(finding.mitigationReason).toBeTruthy();
      expect(finding.mitigationReason!.length).toBeGreaterThan(10);
    }
  });

  it('caps the number of matches so repetition cannot dominate', () => {
    const text = 'OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP OTP';
    const result = analyzeOnce(text);
    const otp = result.findings.find((f) => f.ruleId === 'otp_request') as Finding | undefined;
    expect(otp).toBeDefined();
    expect(otp!.matches.length).toBeLessThanOrEqual(8);
  });

  it('is deterministic for the same input', () => {
    const text = 'Share your OTP now';
    const a = analyzeOnce(text);
    const b = analyzeOnce(text);
    expect(a.score).toBe(b.score);
    expect(a.findings.map((f) => f.ruleId)).toEqual(b.findings.map((f) => f.ruleId));
  });
});
