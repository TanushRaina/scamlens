/**
 * Brand catalogue for URL look-alike detection and trust decisions.
 *
 * Only *static* facts live here. ScamLens never contacts these domains; the
 * list exists so we can recognise "paypal.com.secure-login.xyz" and tell it
 * apart from "paypal.com".
 */

export type BrandCategory =
  'bank' | 'upi' | 'ecommerce' | 'courier' | 'telecom' | 'government' | 'streaming' | 'other';

export interface Brand {
  /** Canonical display name. */
  name: string;
  category: BrandCategory;
  /** Additional spellings worth matching (incl. Hinglish-free romanisations). */
  aliases: string[];
  /**
   * Registrable domains that are genuinely operated by this brand.
   * An exact match on the registrable domain marks a URL as trusted.
   */
  domains: string[];
}

export const BRANDS: Brand[] = [
  {
    name: 'State Bank of India',
    category: 'bank',
    aliases: ['sbi', 'state bank', 'statebank'],
    domains: ['sbi.co.in', 'statebank.co.in', 'statebankofindia.com', 'sbi.com'],
  },
  {
    name: 'HDFC Bank',
    category: 'bank',
    aliases: ['hdfc', 'hdfc bank', 'hdfcbank'],
    domains: ['hdfcbank.com', 'hdfc.com', 'hdfcbank.co.in'],
  },
  {
    name: 'ICICI Bank',
    category: 'bank',
    aliases: ['icici', 'icici bank', 'icicibank'],
    domains: ['icicibank.com', 'icici.com', 'icicibank.co.in'],
  },
  {
    name: 'Axis Bank',
    category: 'bank',
    aliases: ['axis', 'axis bank', 'axisbank'],
    domains: ['axisbank.com', 'axis.co.in', 'axisbank.co.in'],
  },
  {
    name: 'Kotak Mahindra Bank',
    category: 'bank',
    aliases: ['kotak', 'kotak bank', 'kotakmahindra', 'kotakmahindrabank'],
    domains: ['kotak.com', 'kotakbank.com', 'kotak.co.in'],
  },
  {
    name: 'YES Bank',
    category: 'bank',
    aliases: ['yes bank', 'yesbank'],
    domains: ['yesbank.com'],
  },
  {
    name: 'IDFC FIRST Bank',
    category: 'bank',
    aliases: ['idfc', 'idfc first', 'idfcfirst'],
    domains: ['idfcfirstbank.com', 'idfc.com', 'idfcfirstbank.co.in'],
  },
  {
    name: 'Bandhan Bank',
    category: 'bank',
    aliases: ['bandhan', 'bandhan bank', 'bandhanbank'],
    domains: ['bandhanbank.com'],
  },
  {
    name: 'IndusInd Bank',
    category: 'bank',
    aliases: ['indusind', 'indusind bank', 'indusindbank'],
    domains: ['indusindbank.com'],
  },
  {
    name: 'Paytm',
    category: 'upi',
    aliases: ['paytm'],
    domains: ['paytm.com', 'paytm.in', 'paytmpaymentsbank.com'],
  },
  {
    name: 'PhonePe',
    category: 'upi',
    aliases: ['phonepe', 'phone pe'],
    domains: ['phonepe.com', 'phonepe.in'],
  },
  {
    name: 'Google Pay',
    category: 'upi',
    aliases: ['google pay', 'gpay', 'googlepay', 'google'],
    domains: ['google.com', 'g.co', 'google.co.in'],
  },
  {
    name: 'MobiKwik',
    category: 'upi',
    aliases: ['mobikwik'],
    domains: ['mobikwik.com', 'mobikwik.co.in'],
  },
  {
    name: 'Amazon',
    category: 'ecommerce',
    aliases: ['amazon'],
    domains: ['amazon.in', 'amazon.com'],
  },
  {
    name: 'Flipkart',
    category: 'ecommerce',
    aliases: ['flipkart'],
    domains: ['flipkart.com', 'flipkart.co.in'],
  },
  {
    name: 'Myntra',
    category: 'ecommerce',
    aliases: ['myntra'],
    domains: ['myntra.com'],
  },
  {
    name: 'Swiggy',
    category: 'ecommerce',
    aliases: ['swiggy'],
    domains: ['swiggy.com', 'swiggy.in'],
  },
  {
    name: 'Zomato',
    category: 'ecommerce',
    aliases: ['zomato'],
    domains: ['zomato.com', 'zomato.in'],
  },
  {
    name: 'BigBasket',
    category: 'ecommerce',
    aliases: ['bigbasket', 'big basket'],
    domains: ['bigbasket.com'],
  },
  {
    name: 'DHL',
    category: 'courier',
    aliases: ['dhl'],
    domains: ['dhl.com', 'dhl.co.in', 'dhl.de'],
  },
  {
    name: 'FedEx',
    category: 'courier',
    aliases: ['fedex', 'federal express'],
    domains: ['fedex.com'],
  },
  {
    name: 'India Post',
    category: 'courier',
    aliases: ['india post', 'indiapost', 'post office'],
    domains: ['indiapost.gov.in', 'indiapost.co.in'],
  },
  {
    name: 'Delhivery',
    category: 'courier',
    aliases: ['delhivery'],
    domains: ['delhivery.com'],
  },
  {
    name: 'DTDC',
    category: 'courier',
    aliases: ['dtdc'],
    domains: ['dtdc.com', 'dtdc.co.in'],
  },
  {
    name: 'Ekart',
    category: 'courier',
    aliases: ['ekart', 'ekart delivery'],
    domains: ['ekart.com', 'ekart.in'],
  },
  {
    name: 'Airtel',
    category: 'telecom',
    aliases: ['airtel'],
    domains: ['airtel.com', 'airtel.in', 'airtelpaymentsbank.com'],
  },
  {
    name: 'Jio',
    category: 'telecom',
    aliases: ['jio', 'reliance jio', 'reliancejio'],
    domains: ['jio.com', 'jio.in', 'jio.co.in'],
  },
  {
    name: 'Vodafone Idea',
    category: 'telecom',
    aliases: ['vodafone', 'vi', 'vi idea', 'idea'],
    domains: ['vodafone.in', 'vodafone.com', 'idea.in'],
  },
  {
    name: 'BSNL',
    category: 'telecom',
    aliases: ['bsnl'],
    domains: ['bsnl.in', 'bsnl.co.in'],
  },
  {
    name: 'Reserve Bank of India',
    category: 'government',
    aliases: ['rbi', 'reserve bank', 'central bank'],
    domains: ['rbi.org.in', 'rbi.org.in'],
  },
  {
    name: 'Income Tax Department',
    category: 'government',
    aliases: ['income tax', 'incometax', 'cbdt', 'tax department'],
    domains: ['incometax.gov.in', 'incometax.co.in'],
  },
  {
    name: 'UIDAI',
    category: 'government',
    aliases: ['aadhaar', 'uidai', 'uid'],
    domains: ['uidai.gov.in', 'aadhaar.gov.in'],
  },
  {
    name: 'NPCI',
    category: 'government',
    aliases: ['upi', 'npci', 'bharat interface'],
    domains: ['npci.org.in', 'upi.com'],
  },
  {
    name: 'GST Portal',
    category: 'government',
    aliases: ['gst', 'goods and services tax'],
    domains: ['gst.gov.in'],
  },
  {
    name: 'PayPal',
    category: 'other',
    aliases: ['paypal', 'pay pal'],
    domains: ['paypal.com'],
  },
  {
    name: 'Apple',
    category: 'other',
    aliases: ['apple', 'itunes', 'icloud'],
    domains: ['apple.com', 'icloud.com', 'itunes.com'],
  },
  {
    name: 'Microsoft',
    category: 'other',
    aliases: ['microsoft', 'office', 'windows'],
    domains: ['microsoft.com', 'office.com', 'microsoftonline.com'],
  },
  {
    name: 'Netflix',
    category: 'streaming',
    aliases: ['netflix'],
    domains: ['netflix.com', 'netflix.co.in'],
  },
  {
    name: 'Disney+ Hotstar',
    category: 'streaming',
    aliases: ['hotstar', 'disney hotstar', 'disneyplus'],
    domains: ['hotstar.com', 'hotstar.co.in'],
  },
  {
    name: 'WhatsApp',
    category: 'other',
    aliases: ['whatsapp', 'whats app'],
    domains: ['whatsapp.com', 'whatsapp.net', 'wa.me'],
  },
  {
    name: 'Uber',
    category: 'other',
    aliases: ['uber'],
    domains: ['uber.com', 'uber.in'],
  },
];

/** Flattened set of every legitimate registrable domain, for trust checks. */
export const TRUSTED_DOMAINS: ReadonlySet<string> = new Set(BRANDS.flatMap((b) => b.domains));

/** Flattened list of every brand alias / name, lowercase, for look-alike matching. */
export const BRAND_NAMES: ReadonlySet<string> = new Set(
  BRANDS.flatMap((b) => [b.name.toLowerCase(), ...b.aliases.map((a) => a.toLowerCase())]),
);

/** Common URL shorteners. */
export const SHORTENERS: ReadonlySet<string> = new Set([
  'bit.ly',
  'bit.do',
  'tinyurl.com',
  't.co',
  'rb.gy',
  'cutt.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'shorturl.at',
  'shorte.st',
  'clck.ru',
  'gg.gg',
  't.ly',
  'rebrand.ly',
  'shrtco.de',
  '0x0.st',
  'tiny.cc',
  'ulvis.net',
  'cli.ink',
  'spoo.me',
  'th.is',
]);

/**
 * TLDs that are heavily used for throwaway domains. A long list is safer than
 * a short one: a false "suspicious TLD" costs little, a missed one costs a lot.
 */
export const RISKY_TLDS: ReadonlySet<string> = new Set([
  'xyz',
  'top',
  'click',
  'zip',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'work',
  'date',
  'loan',
  'win',
  'bid',
  'review',
  'trade',
  'science',
  'kim',
  'club',
  'online',
  'site',
  'store',
  'live',
  'news',
  'blog',
  'world',
  'vip',
  'icu',
  'fun',
  'rest',
  'cc',
  'biz',
  'info',
  'pw',
  'ru',
  'su',
  'bar',
  'download',
  'stream',
  'gdn',
  'bud',
  'cyou',
  'monster',
  'help',
  'cora',
  'yt',
]);

/** Second-level suffixes that mean the registrable domain is three labels deep. */
export const PUBLIC_SUFFIXES: ReadonlySet<string> = new Set([
  'co.in',
  'com.in',
  'net.in',
  'org.in',
  'gov.in',
  'nic.in',
  'ac.in',
  'edu.in',
  'firm.in',
  'gen.in',
  'ind.in',
  'me.in',
  'up.in',
  'co.uk',
  'com.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'com.au',
  'net.au',
  'org.au',
  'gov.au',
  'edu.au',
  'act.edu.au',
  'com.br',
  'com.cn',
  'co.jp',
  'or.jp',
  'ne.jp',
  'ac.jp',
  'go.jp',
  'com.mx',
  'com.tr',
  'co.nz',
  'co.za',
  'com.sg',
  'com.hk',
  'co.kr',
  'com.tw',
  'com.my',
  'com.ph',
  'com.vn',
  'co.id',
  'com.ar',
  'com.co',
  'com.ua',
  'com.pl',
  'com.ru',
]);
