/**
 * Static URL analysis.
 *
 * ScamLens performs STRUCTURAL checks only. It never fetches, resolves or
 * pings the host. That is stated to the user in the UI because a link can be
 * structurally innocent and still be live phishing — and structurally odd while
 * being a legitimate short link.
 */

import type { UrlAnalysis, UrlCheck } from '../types';
import { BRANDS, PUBLIC_SUFFIXES, RISKY_TLDS, SHORTENERS, TRUSTED_DOMAINS, BRAND_NAMES } from './brands';
import { foldForLookalike, isLookalike, structuralNormalize } from './similarity';

const MAX_URL_LENGTH = 200;

/** Severity -> contribution to the URL's 0..1 risk score. */
const SEVERITY_WEIGHT: Record<UrlCheck['severity'], number> = {
  high: 0.34,
  medium: 0.2,
  low: 0.08,
  info: 0,
};

const MAX_URL_RISK = 0.9;

/** Return the registrable domain ("example.co.in") for a host. */
export function getRegistrableDomain(host: string): string {
  const clean = host.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  if (!clean) return '';

  const labels = clean.split('.').filter((l) => l.length > 0);
  if (labels.length <= 1) return labels[0] ?? '';

  const lastTwo = `${labels[labels.length - 2]}.${labels[labels.length - 1]}`;
  if (PUBLIC_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return `${labels[labels.length - 3]}.${lastTwo}`;
  }
  return lastTwo;
}

/**
 * Extract the host without going through the URL parser.
 *
 * `new URL()` would punycode-encode a Cyrillic host into "xn--..." and hide the
 * exact trick we want to report, so the raw authority is read directly.
 */
function hostOf(normalized: string): string {
  const afterScheme = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const authority = (afterScheme.split(/[/?#]/)[0] ?? '').toLowerCase();
  const at = authority.lastIndexOf('@');
  return at >= 0 ? authority.slice(at + 1) : authority;
}

function protocolOf(normalized: string): string {
  try {
    return new URL(normalized).protocol;
  } catch {
    const m = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
    return m?.[1]?.toLowerCase() ?? '';
  }
}

/** Path + query of the URL, read straight from the string. */
function pathOf(normalized: string): string {
  const afterScheme = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const slash = afterScheme.indexOf('/');
  if (slash < 0) return '';
  const raw = afterScheme.slice(slash);
  const hash = raw.indexOf('#');
  return hash >= 0 ? raw.slice(0, hash) : raw;
}

function countChar(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

/** Scripts present in a host: latin, cyrillic, greek, other. */
function scriptProfile(host: string): { latin: number; cyrillic: number; greek: number } {
  const profile = { latin: 0, cyrillic: 0, greek: 0 };
  for (const ch of host) {
    const code = ch.codePointAt(0) as number;
    if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
      profile.latin += 1;
    } else if (code >= 0x0400 && code <= 0x04ff) {
      profile.cyrillic += 1;
    } else if (code >= 0x0370 && code <= 0x03ff) {
      profile.greek += 1;
    }
  }
  return profile;
}

function findMentionedBrands(host: string, path: string): string[] {
  // Hyphens are removed before comparing so "pay-pal-secure" still counts as a
  // mention of "paypal".
  const hostLabels = host
    .toLowerCase()
    .split('.')
    .filter(Boolean)
    .map((label) => label.replace(/-/g, ''));
  const pathSegments = path
    .toLowerCase()
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ''));
  const mentioned: string[] = [];

  for (const brand of BRANDS) {
    const candidates = brand.aliases.map((a) => a.toLowerCase()).filter((a) => a.length >= 3);
    const hit = candidates.some((alias) => {
      if (hostLabels.some((l) => l === alias || l.startsWith(alias) || l.endsWith(alias))) {
        return true;
      }
      return pathSegments.some((segment) => segment === alias || segment.startsWith(alias));
    });
    if (hit) mentioned.push(brand.name);
  }
  return mentioned;
}

/**
 * Run every static check against one URL.
 */
export function analyzeUrl(raw: string, normalized: string): UrlAnalysis {
  const host = hostOf(normalized);
  const registrableDomain = getRegistrableDomain(host);
  const path = pathOf(normalized);
  const protocol = protocolOf(normalized);
  const checks: UrlCheck[] = [];

  // --- structural checks ------------------------------------------------
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[.*\]$/.test(host)) {
    checks.push({
      id: 'ip_host',
      label: 'Host is an IP address',
      severity: 'high',
      detail: 'Phishing kits are frequently served straight from an IP with no domain at all.',
    });
  }

  if (host.includes('xn--')) {
    checks.push({
      id: 'punycode_host',
      label: 'Host uses Punycode (xn--)',
      severity: 'medium',
      detail:
        'Punycode encodes internationalised domain names and is the usual route for IDN homograph attacks.',
    });
  }

  const profile = scriptProfile(host);
  const nonLatin = profile.cyrillic + profile.greek;
  if (nonLatin > 0 && profile.latin > 0) {
    checks.push({
      id: 'mixed_script_host',
      label: 'Host mixes alphabets',
      severity: 'high',
      detail: 'A host combining Latin with Cyrillic or Greek letters is a classic look-alike domain.',
    });
  }

  let hasUserInfo = false;
  try {
    const parsed = new URL(normalized);
    hasUserInfo = parsed.username !== '' || parsed.password !== '';
  } catch {
    hasUserInfo = normalized.slice(0, normalized.indexOf('/', 8)).includes('@');
  }
  if (hasUserInfo) {
    checks.push({
      id: 'userinfo_at',
      label: 'URL contains "@" before the host',
      severity: 'high',
      detail:
        'Text before "@" is shown as the link label but ignored by the browser — the real destination is behind it.',
    });
  }

  if (SHORTENERS.has(registrableDomain) || SHORTENERS.has(host)) {
    checks.push({
      id: 'shortener',
      label: 'Known URL shortener',
      severity: 'medium',
      detail:
        'Short links hide the real destination until you open them, so the destination cannot be judged from the text.',
    });
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length >= 4) {
    checks.push({
      id: 'many_subdomains',
      label: 'Many subdomains',
      severity: 'medium',
      detail: `The host has ${labels.length} labels. Long chains of subdomains are used to make a fake page look official.`,
    });
  }

  const tld = labels[labels.length - 1] ?? '';
  if (RISKY_TLDS.has(tld)) {
    checks.push({
      id: 'risky_tld',
      label: `Risky top-level domain (.${tld})`,
      severity: 'medium',
      detail: `".${tld}" is among the TLDs most commonly registered for throwaway phishing domains.`,
    });
  }

  if (protocol === 'http:') {
    checks.push({
      id: 'plain_http',
      label: 'Not encrypted (http)',
      severity: 'medium',
      detail: 'An unencrypted link transmits any credentials you enter in clear text.',
    });
  }

  if (normalized.length > MAX_URL_LENGTH) {
    checks.push({
      id: 'long_url',
      label: 'Very long URL',
      severity: 'low',
      detail: `This link is ${normalized.length} characters long, well beyond what a genuine page needs.`,
    });
  }

  const hyphens = countChar(host, '-');
  if (hyphens >= 3) {
    checks.push({
      id: 'many_hyphens',
      label: 'Many hyphens in the host',
      severity: 'low',
      detail: 'Hyphen-heavy host names are used to make a brand name fit a domain the brand does not own.',
    });
  }

  const digits =
    countChar(host, '0') +
    countChar(host, '1') +
    countChar(host, '2') +
    countChar(host, '3') +
    countChar(host, '4') +
    countChar(host, '5') +
    countChar(host, '6') +
    countChar(host, '7') +
    countChar(host, '8') +
    countChar(host, '9');
  if (digits >= 4) {
    checks.push({
      id: 'many_digits',
      label: 'Many digits in the host',
      severity: 'low',
      detail: 'Numeric host names are typical of auto-generated phishing infrastructure.',
    });
  }

  // --- brand checks ----------------------------------------------------
  const trusted = TRUSTED_DOMAINS.has(registrableDomain);

  const mentionedBrands = findMentionedBrands(host, path);
  const mentionedBrand = mentionedBrands[0];
  if (mentionedBrand && !trusted) {
    checks.push({
      id: 'brand_not_in_domain',
      label: `Brand name used but domain is not ${mentionedBrand}'s`,
      severity: 'high',
      detail: `"${mentionedBrand}" appears in this URL, but the domain that actually owns it is "${registrableDomain}".`,
    });
  }

  if (!trusted) {
    const lookalike = isLookalike(host, BRAND_NAMES);
    if (lookalike.lookalike) {
      checks.push({
        id: 'lookalike_domain',
        label: `Look-alike of "${lookalike.name}"`,
        severity: 'high',
        detail: `This host is within ${lookalike.distance} character(s) of the real "${lookalike.name}" spelling after folding look-alike digits and letters.`,
      });
    }

    const riskyWords = [
      'login',
      'verify',
      'verification',
      'secure',
      'security',
      'account',
      'update',
      'confirm',
      'wallet',
      'kyc',
      'support',
      'billing',
      'reset',
      'approve',
      'collect',
      'claim',
      'reward',
      'cashback',
    ];
    const hit = riskyWords.filter((w) => path.toLowerCase().includes(w));
    if (hit.length >= 2) {
      checks.push({
        id: 'suspicious_path_words',
        label: 'Suspicious words in the path',
        severity: 'low',
        detail: `The path contains "${hit.slice(0, 4).join('", "')}" — language used to make a credential harvester look legitimate.`,
      });
    }
  }

  if (trusted) {
    checks.push({
      id: 'trusted_domain',
      label: 'Registrable domain matches a known legitimate domain',
      severity: 'info',
      detail: `"${registrableDomain}" is the real registrable domain for a known brand.`,
    });
  }

  // --- scoring ---------------------------------------------------------
  let score = 0;
  for (const check of checks) score += SEVERITY_WEIGHT[check.severity];
  score = Math.min(MAX_URL_RISK, Math.round(score * 1000) / 1000);

  if (trusted) {
    return {
      raw,
      normalized,
      host,
      registrableDomain,
      trusted: true,
      suspicious: false,
      score: 0,
      checks,
      verdict: `Trusted domain (${registrableDomain}). Links alone cannot prove a message is safe.`,
    };
  }

  const suspicious = checks.some((c) => c.severity === 'high') || score >= 0.5;
  const lookalike = isLookalike(host, BRAND_NAMES);
  const lookalikeOf = lookalike.lookalike ? [lookalike.name] : undefined;

  return {
    raw,
    normalized,
    host,
    registrableDomain,
    trusted: false,
    suspicious,
    score,
    checks,
    lookalikeOf,
    verdict: suspicious
      ? 'Likely a phishing or fraud link — do not open it.'
      : 'No structural problem found; still treat with care, as checks here are structural only.',
  };
}

/** Re-exported so the UI can show what "lookalike" folding does. */
export { foldForLookalike, structuralNormalize };
