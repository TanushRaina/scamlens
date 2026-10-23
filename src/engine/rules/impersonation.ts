/**
 * Impersonation rules: the sender claims to be someone you trust.
 *
 * These rules deliberately require an *identity claim* ("this is your bank",
 * "we are from Amazon support") rather than just naming an institution, because
 * genuine messages also name banks, couriers and telcos. The claim is what a
 * fraudster adds and a real system does not need.
 */

import type { Rule } from '../types';

export const impersonationRules: Rule[] = [
  {
    id: 'bank_impersonation',
    category: 'impersonation',
    label: 'Claims to be your bank',
    weight: 0.45,
    patterns: [
      /\b(?:i am|i'm|we are|we're|this is|iam|hoon)\s+(?:from|from the|of|an?\s|your\s)?(?:your |the )?bank\b/g,
      /\bbank (?:manager|officer|employee|representative|official|team|executive)\b/g,
      /\bbank (?:is|here|calling|sms|team|dedicated)\b/g,
      /\bcalling from your bank\b/g,
      /\b(?:bank|your bank) (?:call|sms|team) (?:kare|kar raha)\b/g,
      /\bbank se\b/g,
      /\bbank bata (?:raha|rahi)\b/g,
      /\b(?:i am|we are) (?:an? )?employee of (?:your |the )?bank\b/g,
    ],
    explanation:
      'Banks do not contact you first claiming to be "your bank" and then ask you to act. The identity claim is what makes the fake message feel official.',
    legitimateBehavior:
      'Identifies the branch or the team, gives a reference number, and points you to the official app or the number printed on your card.',
    advice: 'Hang up and call the number on the back of your card or in the official app.',
  },
  {
    id: 'rbi_impersonation',
    category: 'impersonation',
    label: 'Claims to be the RBI or a regulator',
    weight: 0.55,
    patterns: [
      /\brbi\b/g,
      /\breserve bank (?:of|is)\b/g,
      /\bcentral bank\b/g,
      /\b(?:rbi|central bank) (?:is|has|warns|asks|will|team|official|department)\b/g,
      /\b(?:i am|we are|this is) (?:from |of )?rbi\b/g,
      /\b(?:rbi|central bank) (?:call|sms|team)\b/g,
    ],
    explanation:
      'The Reserve Bank of India does not phone, WhatsApp or SMS individuals about their accounts. Anyone claiming to be RBI is impersonating a regulator.',
    legitimateBehavior:
      'RBI communicates through official circulars and its website. It never asks for OTP, PIN or payment.',
    advice: 'Verify on rbi.org.in. Report the impersonation immediately.',
  },
  {
    id: 'income_tax_impersonation',
    category: 'impersonation',
    label: 'Claims to be the Income Tax department',
    weight: 0.5,
    patterns: [
      /\bincome tax (?:department|dept|officer|notice|return|office)\b/g,
      /\bincome-tax\b/g,
      /\btax department\b/g,
      /\bcbdt\b/g,
      /\b(?:i am|we are|this is) (?:from |of )?(?:income tax|tax department)\b/g,
      /\btax (?:notice|assessment) (?:is|has|pending|issued|approved)\b/g,
      /\bincome tax (?:department|dept) (?:kare|kar raha)\b/g,
    ],
    explanation:
      'The Income Tax department does not demand payment, OTP or gift cards over a message. Fake tax notices are a top-ten fraud category in India.',
    legitimateBehavior:
      'Issues notices by registered post or the e-filing portal, with a clearly stated assessment year and appeal rights.',
    advice: 'Check your tax inbox on the official e-filing portal before responding.',
  },
  {
    id: 'courier_impersonation',
    category: 'impersonation',
    label: 'Claims to be a courier or delivery company',
    weight: 0.4,
    patterns: [
      /\b(?:i am|we are|this is|calling from)\s+(?:from |of |at )?(?:dhl|fedex|india post|courier|delivery|shipping)\b/g,
      /\b(?:dhl|fedex|india post|delhivery|ecom express) (?:is|has|team|official|representative|manager)\b/g,
      /\b(?:courier|delivery|shipping) (?:company|agent|representative|department)\b/g,
      /\b(?:courier|delivery) (?:kare|kar raha|call)\b/g,
    ],
    explanation:
      'A courier does not WhatsApp you about a parcel that needs a fee. The delivery claim is used to make a fee or OTP request look routine.',
    legitimateBehavior:
      "Leaves a missed-call or SMS with a tracking number, and the fee is collected through the courier's own payment page.",
    advice: "Track the parcel on the courier's official website with the tracking number from your order.",
  },
  {
    id: 'telecom_impersonation',
    category: 'impersonation',
    label: 'Claims to be your telecom provider',
    weight: 0.4,
    patterns: [
      /\b(?:i am|we are|this is|calling from)\s+(?:from |of |at )?(?:your |the )?(?:airtel|jio|vi|vodafone|bsnl|idea|tata sky|airtel xstream|broadband)\b/g,
      /\b(?:airtel|jio|vodafone|bsnl|idea|tata sky) (?:official|manager|representative|team|employee|department)\b/g,
      /\btelecom (?:department|provider|company|official)\b/g,
      /\bbroadband (?:department|provider|team|official)\b/g,
      /\b(?:airtel|jio|vodafone|bsnl) (?:call|sms|team|kare)\b/g,
      /\b(?:your|the) (?:airtel|jio|vodafone|bsnl) (?:account|sim|team)\b/g,
    ],
    explanation:
      'Telecom impersonation is used to push a "recharge", "KYC" or SIM-block link. Your carrier already has your number and does not need to verify it by message.',
    legitimateBehavior:
      'Notifies you in the carrier app or by SMS with an official short code, and never asks for an OTP to fix a problem.',
    advice: 'Open your carrier app and check for a genuine alert.',
  },
  {
    id: 'ecommerce_impersonation',
    category: 'impersonation',
    label: 'Claims to be Amazon / Flipkart support',
    weight: 0.4,
    patterns: [
      /\b(?:i am|we are|this is|calling from)\s+(?:from |the )?amazon\b/g,
      /\b(?:i am|we are|this is|calling from)\s+(?:from |of |at )?flipkart\b/g,
      /\bamazon (?:support|team|official|representative|agent|department)\b/g,
      /\bflipkart (?:support|team|official|representative|department|agent)\b/g,
      /\b(?:amazon|flipkart) (?:account|order) (?:team|support|department|security)\b/g,
      /\b(?:amazon|flipkart) (?:kare|kar raha|call kar raha)\b/g,
    ],
    explanation:
      '"Amazon support" that contacts you first is almost always fake. Amazon resolves problems inside the app, not over WhatsApp.',
    legitimateBehavior:
      'Sends a notification inside your Amazon account and never asks for OTP, gift cards or payment to fix an order.',
    advice: 'Open the marketplace app and go to Help > Contact Support yourself.',
  },
  {
    id: 'gov_scheme_impersonation',
    category: 'impersonation',
    label: 'Claims to be a government scheme',
    weight: 0.45,
    patterns: [
      /\bgovernment scheme\b/g,
      /\bgovernment (?:scheme|program|yojana|job|office|official)\b/g,
      /\b(?:pm|svamitva|pmjay|pmay|mnrega|ration|lpg|dbt|jai bhim) (?:scheme|yojana|benefit|portal|app)\b/g,
      /\bsubsidy (?:approval|release|claim|pending|credited)\b/g,
      /\b(?:ministry|department) of (?:finance|revenue|women|rural)\b/g,
      /\b(?:i am|we are) from the (?:government|ministry|department)\b/g,
      /\bgovernment (?:scheme|kare)\b/g,
    ],
    explanation:
      '"Government scheme money" is a stock hook. Subsidies are credited automatically; no official asks you to pay to receive one.',
    legitimateBehavior:
      "Subsidies land in your bank account automatically, and scheme details are on the ministry's own portal.",
    advice: 'Check the scheme on the official ministry website before giving any information.',
  },
  {
    id: 'tech_support_impersonation',
    category: 'impersonation',
    label: 'Claims to be tech support',
    weight: 0.65,
    patterns: [
      /\btech support\b/g,
      /\btechnical support\b/g,
      /\bcomputer (?:support|repair|technician|expert)\b/g,
      /\b(?:your )?(?:computer|pc|laptop|device|mobile|phone) (?:has|is|will be) (?:infected|blocked|compromised|attacked)\b/g,
      /\bvirus (?:detected|found|warning|alert)\b/g,
      /\bwindows (?:support|technician|repair|remote)\b/g,
      /\b(?:software|antivirus|security) (?:company|support|update|license)\b/g,
      /\b(?:your )?(?:computer|pc|laptop|device|mobile) (?:kharab|problem)\b/g,
    ],
    explanation:
      'Nobody can tell you your device is infected from a message. This claim is the entry point for remote-access and gift-card scams.',
    legitimateBehavior:
      'Your device shows its own security alerts. No company cold-contacts you to fix them, and never asks for payment in gift cards.',
    advice: 'Run your own antivirus and never call a number from an unexpected alert.',
  },
  {
    id: 'customer_care_generic',
    category: 'impersonation',
    label: 'Pushes a generic "customer care" number',
    weight: 0.35,
    patterns: [
      /\bcustomer care\b/g,
      /\bcustomer support\b/g,
      /\bcustomer care number\b/g,
      /\bcall (?:us|me) (?:on|at|now|to)\b/g,
      /\b(?:our|the) (?:help|support|care) (?:desk|team|number|line)\b/g,
      /\bhelpline\b/g,
      /\b(?:contact|call) (?:our|the|my) (?:help|support|care)\b/g,
    ],
    explanation:
      'A generic "call our customer care" instruction is weak on its own but is the standard hand-off from a phishing message to a live call-centre scammer.',
    legitimateBehavior:
      'Gives the official published number, which matches the one on your card, app or website.',
    advice: 'Use only numbers you looked up yourself from the official site.',
  },
];
