/**
 * Financial-lure rules: the promise that pulls the victim in.
 *
 * A lure alone is not proof of a scam — friends forward genuine offers, and
 * a bank really does send cashback promotions. The lure's job in the score is
 * to multiply the damage of a credential or payment request, which is what
 * combinations.ts handles.
 */

import type { Rule } from '../types';

export const financialLureRules: Rule[] = [
  {
    id: 'won_prize',
    category: 'financial_lure',
    label: 'Tells you that you have won something',
    weight: 0.55,
    patterns: [
      /\byou have won\b/g,
      /\byou've won\b/g,
      /\byou won\b/g,
      /\bcongratulations,? (?:you|we)\b/g,
      /\bcongratulations!\b/g,
      /\blucky winner\b/g,
      /\byou are (?:the|our) (?:lucky|winner|selected)\b/g,
      /\bcongratulations (?:me)?\b/g,
      /\b(?:tum|aap) jeet (?:gaye|gae|chukeye)\b/g,
    ],
    explanation:
      '"You have won" in a message you did not expect is almost never real. Prize fraud in India overwhelmingly starts with exactly this sentence.',
    legitimateBehavior:
      'Legitimate draws notify you through the channel you entered the draw on, and never ask for a fee or your OTP to release the prize.',
    advice: 'Assume nothing has been won. Do not click or reply.',
  },
  {
    id: 'lottery_claim',
    category: 'financial_lure',
    label: 'Talks about lottery winnings',
    weight: 0.55,
    patterns: [
      /\blottery\b/g,
      /\blucky draw\b/g,
      /\blottery winnings\b/g,
      /\bclaim (?:your|the|it) lottery\b/g,
      /\bwon the lottery\b/g,
      /\b(?:khel|game) (?:jeet|khali)\b/g,
      /\bkhel jeet lo\b/g,
    ],
    explanation:
      'Lotteries you did not enter do not pay out. The "winnings" are always released after a fee — which is the actual scam.',
    legitimateBehavior:
      "A real lottery is claimed on the operator's own verified website, with no upfront payment and no OTP.",
    advice: 'Never pay a fee to receive money you were told you won.',
  },
  {
    id: 'guaranteed_returns',
    category: 'financial_lure',
    label: 'Promises guaranteed returns',
    weight: 0.5,
    patterns: [
      /\bguaranteed (?:returns|profit|income|gains)\b/g,
      /\bassured (?:returns|profit|income)\b/g,
      /\brisk free (?:money|returns|investment|profit)\b/g,
      /\b100% (?:safe|secure|profit|guaranteed)\b/g,
      /\bfixed (?:returns|income|profit)\b/g,
      /\b(?:profit|returns) (?:guarantee|assured)\b/g,
      /\b(?:pay|returns) (?:fixed|assured)\b/g,
    ],
    explanation:
      'Guaranteed returns are impossible in any regulated market. The promise is the bait for investment fraud and fake trading apps.',
    legitimateBehavior:
      'States that investments carry risk, shows historical performance with caveats, and is regulated by SEBI.',
    advice: 'Check whether the adviser or app is registered with SEBI before parting with any money.',
  },
  {
    id: 'double_money',
    category: 'financial_lure',
    label: 'Promises to double your money',
    weight: 0.6,
    patterns: [
      /\bdouble your money\b/g,
      /\bdouble (?:the|your) money\b/g,
      /\bmoney (?:will be|is) doubled\b/g,
      /\bmultiply your money\b/g,
      /\bpaesa double\b/g,
      /\bpaesay (?:double|gyare)\b/g,
      /\b(?:paisa|paise) double karo\b/g,
      /\b100% (?:return|profit) in \d+ (?:hours|days)\b/g,
    ],
    explanation:
      "Doubling money is the oldest confidence-trick promise in circulation. It works by paying the first few victims with later victims' money.",
    legitimateBehavior:
      'No legitimate entity offers to double money. Investment returns are uncertain and disclosed as such.',
    advice: 'Walk away. If it sounds too good to be true, it is a scam.',
  },
  {
    id: 'easy_income',
    category: 'financial_lure',
    label: 'Pitches easy work-from-home income',
    weight: 0.5,
    patterns: [
      /\bwork from home\b/g,
      /\bpart time (?:job|work|income|opportunity)\b/g,
      /\beasy money\b/g,
      /\bmake (?:money|cash) (?:fast|easy|quick)\b/g,
      /\bextra income\b/g,
      /\b(?:simple|easy) (?:job|work|task|money)\b/g,
      /\b(?:no experience|no skills) (?:required|needed|job)\b/g,
      /\b(?:karya|kamai) ghar baithe\b/g,
    ],
    explanation:
      '"Work from home, no experience" recruiting is the standard front for task-based scams, where the victim is paid early and then locked out of their own deposit.',
    legitimateBehavior:
      'Real employers interview you, sign a contract, and never ask you to deposit money or share your OTP to start working.',
    advice: 'Never pay to start a job, and never share OTP with a "manager" on WhatsApp.',
  },
  {
    id: 'reward_claim',
    category: 'financial_lure',
    label: 'Asks you to claim a reward',
    weight: 0.45,
    patterns: [
      /\bclaim your (?:reward|prize|cashback|bonus|money|gift|amount)\b/g,
      /\bclaim (?:your )?(?:reward|prize|bonus|money)\b/g,
      /\byour reward is (?:waiting|ready|available)\b/g,
      /\bunclaimed (?:prize|reward|cash|money|fund)\b/g,
      /\b(?:reward|prize|bonus) (?:claim|release|redeem)\b/g,
      /\b(?:claim|red lelo) inam\b/g,
    ],
    explanation:
      'An unclaimed reward that needs an action from you is a trap. The action is always "send money" or "share an OTP".',
    legitimateBehavior:
      'Credits the reward automatically to the account it belongs to, or points you to the official app.',
    advice: 'Do not click a link to claim anything.',
  },
  {
    id: 'loan_approval_easy',
    category: 'financial_lure',
    label: 'Pitches an instant loan with no documents',
    weight: 0.4,
    patterns: [
      /\binstant loan\b/g,
      /\bloan approved\b/g,
      /\bget loan (?:in |within )?(?:\d+ )?(?:minutes|hours|days)\b/g,
      /\bloan without (?:document|collateral|income proof|guarantee)\b/g,
      /\bno documents? (?:required|needed)\b/g,
      /\b(?:apply|get) (?:a |the )?loan now\b/g,
      /\b(?:loan|credit) (?:approved|disbursed|sanctioned)\b/g,
      /\beasy (?:loan|borrow)\b/g,
    ],
    explanation:
      'Loans are never instant and never need no documents. The "loan" usually arrives with a predatory app that harvests contacts and threatens you on day one.',
    legitimateBehavior:
      'A regulated lender checks income, KYC and CIBIL, and disburses only into an account in your name.',
    advice:
      'Borrow only from banks and NBFCs you can identify, never from an app someone messaged you about.',
  },
  {
    id: 'cashback_offer',
    category: 'financial_lure',
    label: 'Advertises an unusually large cashback',
    weight: 0.3,
    patterns: [
      /\bflat (?:cashback|off|discount)\b/g,
      /\bcashback (?:of|up to|worth|is)\b/g,
      /\b100% cashback\b/g,
      /\b(?:cashback|discount) (?:of|worth) rs\b/g,
      /\blucky (?:customer|user|winner) (?:get|win|claim)\b/g,
      /\b(?:lucky|special) (?:customer|user) (?:get|win)\b/g,
    ],
    explanation:
      'A large cashback on a message you did not expect is a low-weight signal: real promotions exist, but they are almost never pushed through cold contact.',
    legitimateBehavior:
      "Promotions appear inside the app or on the retailer's own site, with terms and an end date.",
    advice: "Check the offer on the retailer's official site before acting.",
  },
  {
    id: 'investment_pitch',
    category: 'financial_lure',
    label: 'Pitches an investment or trading opportunity',
    weight: 0.45,
    patterns: [
      /\binvest (?:now|today|your money|with us)\b/g,
      /\binvestment (?:plan|opportunity|guarantee|option)\b/g,
      /\b(?:btc|bitcoin|ethereum|usdt|usdc|xrp|dogecoin|crypto) (?:investment|trading|business|plan|profit|currency)\b/g,
      /\b(?:crypto|cryptocurrency)\b/g,
      /\btrading (?:app|platform|profit|signal|course)\b/g,
      /\b(?:stock|share) market (?:tips|advice|trading)\b/g,
      /\b(?:invest|investment) karo\b/g,
    ],
    explanation:
      'Investment fraud runs on a fake app or a "manager" who shows you fake profits and withdraws everything the moment you deposit.',
    legitimateBehavior:
      'Offers regulated products, discloses risk, and is registered with SEBI. Never asks you to move money to a personal UPI or crypto wallet.',
    advice: 'Never transfer money to a wallet or UPI ID a "manager" gave you.',
  },
  {
    id: 'fake_refund_offer',
    category: 'financial_lure',
    label: 'Offers a refund or extra money back',
    weight: 0.45,
    patterns: [
      /\b(?:extra|additional) refund\b/g,
      /\brefund (?:process|claim|form|link|approval|is pending)\b/g,
      /\b(?:your|the) (?:order|purchase|transaction) (?:has been|is|will be) refund(?:ed|able)?\b/g,
      /\b(?:order|purchase) cancellation (?:refund|fee)\b/g,
      /\b(?:cancel|cancellation) (?:of|refund)\b/g,
      /\brefund (?:karo|milega|paise)\b/g,
    ],
    explanation:
      '"Your order has been refunded" followed by a step to complete is a refund-recovery scam: the fraudster sends you a fake credit and then asks you to return the "extra".',
    legitimateBehavior:
      'Refunds are automatic and appear in your account history. You are never asked to move money back to "complete" a refund.',
    advice: 'Check your actual account statement rather than trusting the message.',
  },
];
