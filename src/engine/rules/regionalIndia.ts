/**
 * Region-specific rules — India first.
 *
 * Everything India-specific lives in this single file so it can be swapped for
 * another region's rule module without touching the rest of the engine. Add a
 * `regionalXyz.ts`, export `regionalRules`, and import it from rules/index.ts.
 *
 * Included here: UPI Collect fraud, KYC/PAN threats, bill disconnection,
 * FASTag/e-challan, fake part-time jobs, digital arrest, customs parcels,
 * loan-app extortion, and romanized Hinglish keywords.
 */

import type { Rule } from '../types';

export const regionalIndiaRules: Rule[] = [
  {
    id: 'upi_collect_in',
    category: 'regional',
    label: 'UPI Collect request',
    weight: 0.6,
    patterns: [
      /\bupi collect\b/g,
      /\baccept (?:the |this |a |our )?(?:upi )?collect\b/g,
      /\b(?:gpay|google pay|phonepe|paytm|bhim) (?:collect|collect request|collect money)\b/g,
      /\b(?:collect|collection) request (?:on|for) (?:your |the )?upi\b/g,
      /\bupi collect (?:request|money|approve)\b/g,
      /\bcollect (?:request|money) (?:approve|accept|karo)\b/g,
      /\b(?:approve|accept) (?:the |this )?collect\b/g,
    ],
    explanation:
      'A UPI "Collect" request asks YOU to approve money leaving your account. Fraudsters send one and then pressure you to accept it — the money leaves as a legitimate-looking payment to them.',
    legitimateBehavior:
      'Pays by sending money to a verified merchant UPI ID, or asks you to pay only inside the app after you confirm the order.',
    advice: 'Never accept a UPI Collect request from someone who contacted you. Reject it in your UPI app.',
  },
  {
    id: 'kyc_pending_in',
    category: 'regional',
    label: '"KYC pending / expired" threat',
    weight: 0.55,
    patterns: [
      /\bkyc (?:is |will be )?(?:pending|expired|expire|incomplete|not complete|not done)\b/g,
      /\b(?:your |the |a )?kyc (?:pending|expired|expires)\b/g,
      /\bkyc ko (?:update|complete|verify|karo)\b/g,
      /\bkyc (?:update|complete|verify) karo\b/g,
      /\bkyc (?:pending|expired) hai\b/g,
      /\bcomplete (?:your|the|a) kyc (?:now|today|immediately|turrant|jaldi)\b/g,
    ],
    explanation:
      '"Your KYC is pending" is the standard hook for fake banking, SIM and UPI scams. KYC is completed on the official app or at a branch — not through a message link.',
    legitimateBehavior:
      'Tells you to open the official app and complete KYC there, and gives a reference number.',
    advice: 'Complete KYC only inside your bank or UPI app.',
  },
  {
    id: 'pan_update_required',
    category: 'regional',
    label: '"PAN card update required" threat',
    weight: 0.45,
    patterns: [
      /\bpan card update\b/g,
      /\bupdate (?:your|the|a) pan\b/g,
      /\b(?:your |the )?pan (?:is |will be )?(?:expired|blocked|invalid|blocked)\b/g,
      /\bpan (?:update|verify|complete) karo\b/g,
      /\bpan card (?:update|verify|complete)\b/g,
      /\blink (?:your|the) pan\b/g,
    ],
    explanation:
      'PAN updates are done on the Income Tax portal, never by message. The "update now" link is a credential harvester.',
    legitimateBehavior:
      'Directs you to incometax.gov.in or to a branch, with a reference number and no urgency.',
    advice: 'Update PAN only on the official Income Tax e-filing site.',
  },
  {
    id: 'bill_disconnection',
    category: 'regional',
    label: 'Threatens disconnection of a utility',
    weight: 0.5,
    patterns: [
      /\b(?:bill|connection|supply) (?:will be|is|has been)?\s?(?:disconnected|cut off|cut|terminated|disconnection)\b/g,
      /\b(?:power|electricity|gas|water|broadband|landline) (?:cut|cut off|disconnection|disconnect|khatam)\b/g,
      /\b(?:disconnection|cut-off) (?:warning|notice|threat|karaya|aayi)\b/g,
      /\b(?:bill|connection|supply) (?:khata band|band|khatam)\b/g,
      /\b(?:bill|connection) (?:pay|payment) (?:karo|karoge|dena)\b/g,
    ],
    explanation:
      'Utility disconnection threats are used to push a fake payment page. Real disconnections need no payment in a WhatsApp message.',
    legitimateBehavior:
      'Gives an account number, a due date and the official payment channels, and never asks for OTP or a link.',
    advice: "Pay bills only on the utility's official portal or app.",
  },
  {
    id: 'bill_mention',
    category: 'regional',
    label: 'Mentions a utility bill',
    weight: 0.15,
    patterns: [
      /\b(?:electricity|electric|power|gas|water|broadband|landline|mobile) (?:bill|connection|recharge)\b/g,
      /\b(?:bill|connection) (?:due|pending|overdue|amount)\b/g,
      /\b(?:pay|clear) (?:your|the|a) bill\b/g,
    ],
    explanation:
      'Mentioning a bill is weak on its own — genuine reminders do exist. It matters only when paired with a payment link or an OTP request.',
    legitimateBehavior: 'States the amount, the due date and the official payment channels.',
    advice: 'Check the balance in the official utility app before paying.',
  },
  {
    id: 'fastag_challan',
    category: 'regional',
    label: 'FASTag / e-challan payment demand',
    weight: 0.45,
    patterns: [
      /\bfastag (?:challan|payment|clear|fine|penalty|recharge)\b/g,
      /\be-?challan\b/g,
      /\bchallan (?:is|has been|pending|payment|clear|fine|dena)\b/g,
      /\b(?:toll|challan|fastag) (?:fee|charge|payment|tax|balance|fine|penalty)\b/g,
      /\b(?:fastag|challan) (?:payment|karo|karoge|dena|clear)\b/g,
      /\b(?:challan|fine) (?:pay|payment)\b/g,
    ],
    explanation:
      'FASTag and e-challan notices are a fast-growing scam in India: a fine link in an SMS that harvests credentials or asks for a "release fee". Fines are paid on the official Highways/Challan portal.',
    legitimateBehavior:
      'Directs you to the official challan portal with the vehicle number and a reference number.',
    advice: 'Pay challans only on the official government portal.',
  },
  {
    id: 'fake_job_task',
    category: 'regional',
    label: 'Fake part-time / task-based job',
    weight: 0.55,
    patterns: [
      /\bpart time job\b/g,
      /\bpart-time job\b/g,
      /\bwork from home (?:job|work|opportunity|income)\b/g,
      /\b(?:simple|easy|data entry|typing) (?:job|work|task)\b/g,
      /\btask (?:based|money|payment|complete|complete the)\b/g,
      /\bdaily (?:income|salary|earning|payout|payment)\b/g,
      /\b(?:earn|kamai) (?:rs|₹|rupees)?\s*\d{3,}\s*(?:per|a)? ?day\b/g,
      /\bjob (?:guaranteed|without (?:interview|experience|skill))\b/g,
      /\b(?:task|kam) (?:complete|karo|karoge)\b/g,
      /\b(?:job|work) (?:mil|milega)\b/g,
    ],
    explanation:
      'Task scams pay you a few small amounts to build trust, then ask for a deposit or an OTP to "unlock" the next task — and take everything.',
    legitimateBehavior:
      'A real employer interviews you, gives a written offer and never asks for money or OTP before your first pay cheque.',
    advice: 'Never pay a deposit or share an OTP to start a job.',
  },
  {
    id: 'digital_arrest_in',
    category: 'regional',
    label: '"Digital arrest" / cyber-cell threat',
    weight: 0.65,
    patterns: [
      /\bdigital arrest\b/g,
      /\bdigital arrest warrant\b/g,
      /\b(?:police|cyber (?:cell|crime)|crime branch) (?:is |will |calling|call|kare|aayi|aa gai)\b/g,
      /\b(?:cyber (?:cell|crime)|police) (?:department|official|officer|station|team)\b/g,
      /\byou are (?:involved|named|wanted) in a (?:crime|case|fraud)\b/g,
      /\bcase (?:is|has been) (?:filed|registered) against you\b/g,
      /\b(?:narco|cyber) (?:cell|crime)\b/g,
      /\bpolice (?:bula lega|bulaoge|bulandoge|bulayega)\b/g,
    ],
    explanation:
      '"Digital arrest" is a specifically Indian scam: the caller claims to be from a cyber cell and uses a fake video call to make you believe you are being arrested. Police never resolve this over a call.',
    legitimateBehavior:
      'Investigates formally. If police need you they attend in person or call from a verifiable station number.',
    advice: 'Do not share anything, do not pay, and report it to cybercrime.gov.in or 1930.',
  },
  {
    id: 'customs_parcel',
    category: 'regional',
    label: 'Customs parcel fee scam',
    weight: 0.5,
    patterns: [
      /\bcustoms\b/g,
      /\bparcel (?:is|has been|was) (?:held|blocked|seized|pending|clearance|detained)\b/g,
      /\b(?:clearance|customs) (?:fee|charge|duty|payment)\b/g,
      /\b(?:dhl|fedex|courier) (?:parcel|package|shipment) (?:is|has been|was) (?:held|blocked|pending)\b/g,
      /\b(?:parcel|package|shipment) (?:held|blocked|seized|clearance)\b/g,
      /\bcustoms (?:karo|payment)\b/g,
    ],
    explanation:
      'The parcel-held-at-customs story is used to collect a fee for a parcel you never ordered. The fee is the whole scam.',
    legitimateBehavior:
      "Customs notices arrive by post or through the courier's official tracking page, and fees are itemised.",
    advice: "Track the shipment on the courier's official website and never pay a fee from a message.",
  },
  {
    id: 'loan_app_threat',
    category: 'regional',
    label: 'Loan app extortion threat',
    weight: 0.5,
    patterns: [
      /\bloan app\b/g,
      /\b(?:your |the )?loan (?:is|will be|overdue|defaulted|rejected|blocked|cancelled)\b/g,
      /\b(?:emi|loan) (?:due|overdue|pending|not paid|clear|clear karo)\b/g,
      /\b(?:loan|emi) (?:recovery|agent|department|team|collection)\b/g,
      /\b(?:loan|emi|payment) (?:kare|kar raha|collection|dena)\b/g,
      /\b(?:loan|emi) (?:app|app se)\b/g,
    ],
    explanation:
      'Predatory loan apps harass borrowers with threats, contact-list sharing and fake recovery agents. Genuine lenders do not threaten arrest over a message.',
    legitimateBehavior:
      'Issues a formal default notice, offers a restructuring plan, and never threatens criminal action in a chat.',
    advice: 'Report predatory loan apps to the RBI portal and block the contacts.',
  },
  {
    id: 'hinglish_urgency',
    category: 'regional',
    label: 'Romanized Hinglish urgency words',
    weight: 0.35,
    patterns: [
      /\bturrant\b/g,
      /\bturrant (?:karo|karke|kar|do|suno)\b/g,
      /\babhi (?:karo|karke|kar|suno|batana|click|pay|payment|submit|karoge)\b/g,
      /\bjaldi (?:karo|karke|kar|do|suno|click|pay)\b/g,
      /\bfauran\b/g,
      /\bek baar\b/g,
      /\bcarhe\b/g,
      /\b(?:abhi|turrant|jaldi) (?:pay|payment|submit|click|share|karo)\b/g,
      /\babhi (?:complete|update|verify|submit|pay|click|karo) karo\b/g,
      /\botp (?:batao|batan|dikhao|send karo|mangta|mang raha|chahiye)\b/g,
    ],
    explanation:
      'Romanized Hindi urgency words ("turrant", "abhi", "jaldi karo") are a hallmark of Indian scam scripts. They are a moderate signal on their own and decisive next to money or OTP.',
    legitimateBehavior:
      'A genuine message gives a deadline in plain terms and does not order you to act instantly.',
    advice: 'If a stranger orders you to act "abhi", that is pressure, not service.',
  },
  {
    id: 'hinglish_money',
    category: 'regional',
    label: 'Romanized Hinglish money pitch',
    weight: 0.35,
    patterns: [
      /\bpaisa (?:jeeo|kamao|kama lo|jeet lo|jee lo)\b/g,
      /\bpaise (?:jeet|kama|kamao|kama lo)\b/g,
      /\binnaam (?:jeet|le lo|paiso|kamao|milega)\b/g,
      /\bkamai\b/g,
      /\bpaisa kamaye\b/g,
      /\bpaesay (?:kamao|jeeo|kamaoge)\b/g,
      /\bpaisa kamao\b/g,
      /\b(?:jeet lo|jeeo) paisa\b/g,
    ],
    explanation:
      '"Paisa kamao" style promises are the local version of the easy-money lure. They are a moderate signal, and a strong one next to a task or UPI request.',
    legitimateBehavior: 'A real income opportunity is specific about the work, the pay and the employer.',
    advice: "Ask for the employer's registered name and verify it.",
  },
  {
    id: 'hinglish_click',
    category: 'regional',
    label: 'Romanized "click on the link" instruction',
    weight: 0.4,
    patterns: [
      /\blink par (?:click|tap|open) karo\b/g,
      /\blink (?:par|pe) (?:click|open|click karo)\b/g,
      /\bclick (?:karo|karke)\b/g,
      /\b(?:open|click) (?:karo|karke|karoge)\b/g,
      /\blink (?:click|open) karo\b/g,
    ],
    explanation:
      'Instructing you to click in romanized Hindi is the final step of a phishing script. Real institutions tell you what happened, not what to click.',
    legitimateBehavior:
      'Tells you to open the official app or a known website, and never supplies a shortened or obfuscated link.',
    advice: 'Never click a link in a message you did not expect.',
  },
];
