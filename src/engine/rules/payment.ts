/**
 * Payment red flags: the *method* of payment demanded.
 *
 * A gift card, crypto wallet or "pay a small fee to release" request is the
 * clearest possible signal that the money is leaving through a channel that
 * cannot be reversed and cannot be traced back to the receiver.
 */

import type { Rule } from '../types';

export const paymentRules: Rule[] = [
  {
    id: 'gift_card_payment',
    category: 'payment_redflag',
    label: 'Demands payment in gift cards',
    weight: 0.7,
    patterns: [
      /\bgift card\b/g,
      /\bgift cards\b/g,
      /\bgift (?:voucher|card|coupon)\b/g,
      /\b(?:amazon|flipkart|paytm|swiggy|zomato|zeel|iphone|itunes|apple|google play|steam) gift (?:card|voucher)\b/g,
      /\bgift card (?:code|number|pin|scratch|image)\b/g,
      /\bsend (?:us|me) (?:a |the )?gift card\b/g,
      /\b(?:gift card|giftcard) (?:kharid|send|karo)\b/g,
      /\bgift card se (?:pay|payment)\b/g,
    ],
    explanation:
      'Gift cards are the single most-used scam payment method because they are instant, irreversible and anonymous. No real business asks for them.',
    legitimateBehavior:
      'Takes payment by card, UPI to a verified merchant ID, net banking or invoice. Never asks for gift cards.',
    advice: 'Do not buy a gift card for anyone who contacted you.',
  },
  {
    id: 'crypto_payment',
    category: 'payment_redflag',
    label: 'Demands payment in crypto',
    weight: 0.65,
    patterns: [
      /\bcryptocurrency\b/g,
      /\bcrypto\b/g,
      /\bbitcoin\b/g,
      /\b(?:btc|eth|usdt|usdc|xrp|dogecoin|tether)\b/g,
      /\b(?:crypto|bitcoin|usdt|usdc|tether) (?:wallet|payment|transfer|deposit|investment)\b/g,
      /\b(?:crypto|bitcoin) (?:kharid|payment|transfer)\b/g,
      /\bwallet address\b/g,
    ],
    explanation:
      'Crypto payments are irreversible and effectively untraceable to the receiver. Any legitimate demand is a scam.',
    legitimateBehavior:
      'Uses a regulated payment channel. Legitimate refunds and bill payments never go to a crypto wallet.',
    advice: 'Never send crypto to an address given in a message.',
  },
  {
    id: 'wire_transfer',
    category: 'payment_redflag',
    label: 'Demands a wire transfer',
    weight: 0.5,
    patterns: [
      /\bwire transfer\b/g,
      /\bwire (?:transfer|payment)\b/g,
      /\bbank transfer\b/g,
      /\b(?:rtgs|neft|imps) (?:transfer|payment)\b/g,
      /\bsend (?:money|funds|payment) (?:via|through|by|to) (?:wire|transfer|rtgs|neft)\b/g,
      /\b(?:transfer|payment) (?:karo|karo)\b/g,
      /\b(?:bank|net banking) (?:se )?payment\b/g,
    ],
    explanation:
      'A wire transfer to an account you did not verify is money gone. Scammers use it for "release" and "refund" frauds.',
    legitimateBehavior:
      'Bills you through a regulated channel with an invoice, and the payee is the company itself, not a stranger.',
    advice: 'Verify the payee on the official invoice before any transfer.',
  },
  {
    id: 'fee_to_release',
    category: 'payment_redflag',
    label: 'Asks for money to "release" something',
    weight: 0.6,
    patterns: [
      /\bpay (?:a |the |small |processing |customs |release |clearance )?(?:fee|charge|charges|amount|money|rs\.?\s?\d+)\b/g,
      /\b(?:release|unblock|unfreeze|activate|claim|process|clear) (?:your |the |a |us )?(?:money|funds|reward|prize|parcel|package|account|loan|amount)\b/g,
      /\bpay to (?:release|claim|activate|get|clear)\b/g,
      /\b(?:release|customs|clearance|processing) fee\b/g,
      /\b(?:parcel|package|money|funds|reward) (?:is|was) (?:held|blocked|pending|seized)\b/g,
      /\b(?:pay|payment) (?:karo|karoge)\b/g,
      /\b(?:fee|charge) (?:to |for )?(?:release|claim|activate)\b/g,
    ],
    explanation:
      'Nobody legitimate charges a fee to give you money or to unblock your own funds. This phrasing is the signature of parcel, loan and reward scams.',
    legitimateBehavior:
      'Money is released automatically, or the fee is a real, itemised charge on an official invoice you can verify.',
    advice: 'Never pay a fee to receive money.',
  },
  {
    id: 'processing_fee',
    category: 'payment_redflag',
    label: 'Charges a "processing fee" upfront',
    weight: 0.45,
    patterns: [
      /\bprocessing fee\b/g,
      /\bprocessing charges\b/g,
      /\bfee (?:to|for) (?:process|release|activate|claim|approve)\b/g,
      /\b(?:one time|nominal|small|minimal|smallest) (?:fee|charge|amount)\b/g,
      /\b(?:service|activation|transfer|registration) charges?\b/g,
      /\b(?:fee|charge) (?:pay karo|payment)\b/g,
    ],
    explanation:
      'A small upfront fee on a prize, loan or job is the loss that unlocks the rest of the scam. Legitimate fees are itemised on an invoice, never demanded in a chat.',
    legitimateBehavior:
      'States the fee, its purpose and its GST treatment on an official document, and you can refuse without consequence.',
    advice: 'Do not pay any fee before you have verified the request on the official site.',
  },
  {
    id: 'refundable_deposit',
    category: 'payment_redflag',
    label: 'Asks for a refundable deposit',
    weight: 0.5,
    patterns: [
      /\brefundable deposit\b/g,
      /\bsecurity deposit\b/g,
      /\b(?:caution|refundable|security) money\b/g,
      /\b(?:pay|send|transfer) (?:us )?(?:a |the |your )?deposit\b/g,
      /\bdeposit (?:to|for|karo) (?:register|release|activate|join|start)\b/g,
      /\b(?:deposit|payment) (?:karo|karoge)\b/g,
    ],
    explanation:
      '"The deposit comes back" is the lie that keeps task-scam victims paying. It never comes back, and the "job" disappears.',
    legitimateBehavior:
      'Real employers and platforms never ask for a deposit to start working or to receive a benefit.',
    advice: 'Never pay a deposit to begin working or to claim money.',
  },
];
