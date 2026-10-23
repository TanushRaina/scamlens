/**
 * Urgency rules: pressure designed to stop you thinking.
 *
 * Urgency on its own is a moderate signal (a friend can be urgent, a delivery
 * can be time-limited). It becomes decisive when paired with a credential or
 * payment request, which is exactly what combinations.ts models.
 */

import type { Rule } from '../types';

export const urgencyRules: Rule[] = [
  {
    id: 'within_24h',
    category: 'urgency',
    label: 'Sets a short deadline',
    weight: 0.5,
    patterns: [
      /\bwithin 24 hours\b/g,
      /\bwithin 12 hours\b/g,
      /\bwithin 48 hours\b/g,
      /\bwithin (?:an? |one |two )?hour(?:s)?\b/g,
      /\bwithin 15 minutes\b/g,
      /\bwithin 30 minutes\b/g,
      /\bwithin an hour\b/g,
      /\b(?:only )?(?:24|12|48) hours left\b/g,
      /\b(?:do it|complete) within\b/g,
    ],
    explanation:
      'A genuine notice gives you days and a reference number. A message that says it will happen "within 24 hours" is rushing you past the part where you would check.',
    legitimateBehavior:
      'Gives a date, a reference number and a link to the official portal — and still gives you time to verify.',
    advice: 'Slow down. Take the time you are being denied.',
  },
  {
    id: 'immediately_act',
    category: 'urgency',
    label: 'Says to act immediately',
    weight: 0.4,
    patterns: [
      /\bimmediately\b/g,
      /\bact now\b/g,
      /\bplease act\b/g,
      /\bdo it now\b/g,
      /\bright now\b/g,
      /\burgently (?:required|needed|action)\b/g,
      /\bact (?:turrant|abhi|jaldi)\b/g,
    ],
    explanation:
      '"Do it now" is pressure language. Legitimate requests explain what happened; they do not order you to act in the same breath.',
    legitimateBehavior:
      'Explains the situation and what will happen next, with a deadline and a way to check it.',
    advice: 'Put the phone down for two minutes and think it through.',
  },
  {
    id: 'account_suspended',
    category: 'urgency',
    label: 'Threatens to block or suspend your account',
    weight: 0.55,
    patterns: [
      /\baccount will be (?:suspended|blocked|frozen|closed|deactivated|blocked)\b/g,
      /\byour account (?:has been|is) (?:blocked|suspended|frozen|closed|deactivated)\b/g,
      /\baccount (?:block|blocking|blocked)\b/g,
      /\b(?:your |the )?account ko (?:block|blocked|band)\b/g,
      /\b(?:account|bank account) (?:will be|is) (?:closed|cut)\b/g,
      /\b(?:services|access) will be (?:suspended|blocked|terminated)\b/g,
    ],
    explanation:
      'Threatening to block an account is the standard hook for a phishing link. Real suspensions are done quietly, with notice, and never fixed by clicking a message.',
    legitimateBehavior:
      'Notifies you that access was restricted, then directs you to the official app or a branch — and never asks for credentials in the same message.',
    advice:
      'Check the official app or call the number on your card. Nothing is urgent enough to click a message link.',
  },
  {
    id: 'last_warning',
    category: 'urgency',
    label: 'Calls itself a "last warning"',
    weight: 0.5,
    patterns: [
      /\blast warning\b/g,
      /\bfinal warning\b/g,
      /\blast notice\b/g,
      /\bfinal notice\b/g,
      /\bno further (?:notice|warning|reminder)\b/g,
      /\b(?:last|final) (?:reminder|chance)\b/g,
    ],
    explanation:
      '"Last warning" is a threat pattern used to make you skip verification. Real notices carry a case or reference number, not a countdown.',
    legitimateBehavior:
      'States the exact consequence, the date it applies and a reference number you can quote.',
    advice: 'Ignore the countdown and verify independently.',
  },
  {
    id: 'legal_action',
    category: 'urgency',
    label: 'Threatens legal action',
    weight: 0.55,
    patterns: [
      /\blegal action\b/g,
      /\blegal proceedings\b/g,
      /\blegal notice\b/g,
      /\btake legal action\b/g,
      /\bpolice complaint\b/g,
      /\b(?:file|register) a (?:police |legal )?complaint\b/g,
      /\bcriminal case\b/g,
      /\b(?:court|judge|lawyer|attorney) (?:will|has|order)\b/g,
    ],
    explanation:
      'Threatening legal consequences over a message is a classic impersonation tactic. Police and courts do not collect money or OTPs over WhatsApp.',
    legitimateBehavior:
      'Serves formal notice by registered post or official e-mail, and never asks for payment or credentials in a chat.',
    advice: 'Report it to cybercrime.gov.in or call 1930 if you are in India.',
  },
  {
    id: 'arrest_threat',
    category: 'urgency',
    label: 'Threatens arrest or detention',
    weight: 0.6,
    patterns: [
      /\byou will be arrested\b/g,
      /\barrested\b/g,
      /\barrest (?:warrant|order|notice)\b/g,
      /\bdetention\b/g,
      /\bjail\b/g,
      /\bimprisonment\b/g,
      /\bpolice (?:will|may) arrest\b/g,
      /\b(?:police|cops) (?:are|is) coming\b/g,
      /\b(?:jail| arrest) karna\b/g,
    ],
    explanation:
      'Threatening jail is the strongest pressure a scammer can apply. Police never resolve an investigation by asking for money, gift cards or a UPI approval.',
    legitimateBehavior:
      'Investigates through formal channels. If police genuinely need you they come to your address or call from a verifiable station number.',
    advice: 'Do not pay, do not share anything, and report the message.',
  },
  {
    id: 'sim_deactivate',
    category: 'urgency',
    label: 'Threatens to deactivate your SIM',
    weight: 0.55,
    patterns: [
      /\bsim (?:will be|is|was) deactivated\b/g,
      /\bsim (?:card )?(?:deactivation|blocked|blocking)\b/g,
      /\bsim (?:card )?(?:will be|is) (?:blocked|cut|cancelled|terminated)\b/g,
      /\bsim card expire\b/g,
      /\bsim (?:is|will be) (?:disconnected|terminated)\b/g,
      /\bsim band\b/g,
      /\bsim (?:card )?khata band\b/g,
    ],
    explanation:
      '"Your SIM will be deactivated" is a common Indian phishing hook — it panics you into clicking a link that steals your credentials or asks you to share an OTP.',
    legitimateBehavior:
      'A telecom company suspends a SIM for KYC reasons and tells you to complete KYC on their official app or at a store — not through a link in an SMS.',
    advice: "Verify SIM status in your carrier's official app before clicking anything.",
  },
  {
    id: 'expires_today',
    category: 'urgency',
    label: 'Says something expires today',
    weight: 0.45,
    patterns: [
      /\bexpires (?:today|tonight|now|immediately)\b/g,
      /\bexpiry (?:date|today|warning)\b/g,
      /\bvalid only (?:for|till|until|today)\b/g,
      /\b(?:bonus|offer|link|account|reward) (?:will )?expire\b/g,
      /\bexpires in 24 hours\b/g,
      /\b(?:link|offer|reward) expire\b/g,
    ],
    explanation:
      'An expiring offer is the lure half of a scam: it pushes you to act before you check who is really asking.',
    legitimateBehavior:
      "Gives a clear end date on the institution's own website, not a countdown in a stranger's message.",
    advice: 'Check the real offer on the official site.',
  },
];
