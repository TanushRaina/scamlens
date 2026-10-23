/**
 * One-click demo messages for the "Try a sample" list.
 *
 * At least one sample MUST be legitimate — the whole point of the tool is to
 * show that it can also say "this looks fine", and that it explains why.
 *
 * The `expected` band is checked by tests/samples.test.ts, so every sample has
 * to land where it claims. The set deliberately covers all four verdict bands:
 * a visitor can see what a Low, Medium, High and Critical message look like.
 */

export type SampleExpectation = 'low' | 'medium' | 'high' | 'critical';

export interface Sample {
  id: string;
  title: string;
  /** Verdict band the sample should land in, checked by tests. */
  expected: SampleExpectation;
  text: string;
  note: string;
}

export const SAMPLES: readonly Sample[] = [
  // --- Critical ---------------------------------------------------------
  {
    id: 'otp-phishing',
    title: 'OTP phishing (SBI)',
    expected: 'critical',
    text: 'Your SBI debit card has been blocked. Share your OTP to unblock it immediately.',
    note: 'Classic account-takeover request.',
  },
  {
    id: 'kyc-scam',
    title: 'KYC deadline scam',
    expected: 'critical',
    text: 'Your KYC is pending. Update it now or your account will be suspended within 24 hours. Verify at http://hdfcbank-verify.co.in',
    note: 'Deadline plus a look-alike banking domain.',
  },
  {
    id: 'prize-scam',
    title: 'Prize + processing fee',
    expected: 'critical',
    text: 'Congratulations! You have won Rs 8,00,000 in the Lucky Draw. Claim your reward by paying a small processing fee.',
    note: 'Money you never entered a draw for.',
  },
  {
    id: 'digital-arrest',
    title: 'Digital arrest threat',
    expected: 'critical',
    text: 'You are involved in a cybercrime case. The cyber cell will arrest you. Do not tell anyone. Pay the fine now.',
    note: 'Threat plus secrecy plus payment.',
  },
  {
    id: 'phishing-url',
    title: 'Look-alike PayPal link',
    expected: 'critical',
    text: 'Your PayPal account will be suspended. Verify your account here: https://paypal.com.secure-login.xyz',
    note: 'Brand name used on a domain that does not own it.',
  },
  {
    id: 'courier-fee',
    title: 'Courier clearance fee',
    expected: 'critical',
    text: 'Your DHL parcel is held at customs. Pay the Rs 499 clearance fee to release it now.',
    note: 'Fee-to-release parcel fraud.',
  },
  {
    id: 'fake-job',
    title: 'Fake work-from-home job',
    expected: 'critical',
    text: 'Work from home, no experience required. Earn Rs 5000 per day. Task based payment. Join our Telegram group.',
    note: 'Task scam funnel into a private chat.',
  },

  // --- High -------------------------------------------------------------
  {
    id: 'hinglish-upi',
    title: 'Hinglish UPI collect',
    expected: 'high',
    text: 'UPI collect request hai. Accept karo apna paisa milega.',
    note: 'Romanized Hindi UPI collect fraud.',
  },

  // --- Medium -----------------------------------------------------------
  {
    id: 'medium-bill',
    title: 'Bill reminder with a link',
    expected: 'medium',
    text: 'Your electricity bill of Rs 2,100 is due on 28 Oct. Pay at https://www.tatapower.com',
    note: 'A plausible bill notice — flagged only for the unverified link.',
  },
  {
    id: 'medium-verify',
    title: 'Generic "verify your account"',
    expected: 'medium',
    text: 'Please verify your account details to continue.',
    note: 'One moderate signal and nothing else — the engine stays cautious.',
  },

  // --- Low (legitimate) -------------------------------------------------
  {
    id: 'legit-bank-alert',
    title: 'LEGITIMATE bank debit alert',
    expected: 'low',
    text: 'A/c XX1234 debited Rs 500 on 22 Oct 2026 at HDFC ATM. If not done by you, call 1800-202-6161.',
    note: 'A real alert should score low. This is the control case.',
  },
  {
    id: 'legit-otp-warning',
    title: 'LEGITIMATE OTP with a warning',
    expected: 'low',
    text: 'OTP 739102 sent to your mobile. Bank will never ask for this OTP.',
    note: 'A genuine OTP message protects you instead of asking.',
  },
];
