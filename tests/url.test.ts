/**
 * URL analysis tests: extraction, registrable-domain handling and every static
 * check, each with a positive and a negative case.
 */

import { describe, expect, it } from 'vitest';
import { extractUrls, isWholeInputUrl } from '../src/engine/url/parseUrls';
import { analyzeUrl, getRegistrableDomain } from '../src/engine/url/analyzeUrl';
import {
  levenshtein,
  structuralNormalize,
  foldForLookalike,
  isLookalike,
} from '../src/engine/url/similarity';
import { TRUSTED_DOMAINS, SHORTENERS, RISKY_TLDS, BRAND_NAMES } from '../src/engine/url/brands';

function urlOf(raw: string) {
  const extracted = extractUrls(raw)[0];
  if (!extracted) throw new Error(`no URL found in: ${raw}`);
  return analyzeUrl(extracted.raw, extracted.normalized);
}

function hasCheck(url: ReturnType<typeof urlOf>, id: string): boolean {
  return url.checks.some((c) => c.id === id);
}

describe('url extraction', () => {
  it('finds a scheme URL and maps offsets back to the original', () => {
    const text = 'Please verify at https://example.com/login?x=1 now';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(1);
    expect(urls[0]?.normalized).toBe('https://example.com/login?x=1');
    expect(text.slice(urls[0]!.start, urls[0]!.end)).toBe('https://example.com/login?x=1');
  });

  it('finds a URL written without a scheme', () => {
    const urls = extractUrls('Open bit.ly/abc123 to claim');
    expect(urls).toHaveLength(1);
    expect(urls[0]?.normalized).toBe('bit.ly/abc123');
  });

  it('unfolds the hxxp obfuscation', () => {
    const urls = extractUrls('Go to hxxps://paypal.com/x');
    expect(urls[0]?.normalized).toBe('https://paypal.com/x');
  });

  it('unfolds the [.] obfuscation and keeps the original offsets', () => {
    const text = 'Verify at https://hdfcbank[.]co[.]in-security.xyz';
    const urls = extractUrls(text);
    expect(urls[0]?.normalized).toBe('https://hdfcbank.co.in-security.xyz');
    expect(text.slice(urls[0]!.start, urls[0]!.end)).toBe('https://hdfcbank[.]co[.]in-security.xyz');
  });

  it('ignores the local part of an email address', () => {
    expect(extractUrls('mail me at user@example.com today')).toEqual([]);
  });

  it('trims trailing sentence punctuation', () => {
    const urls = extractUrls('Visit example.com. Thank you');
    expect(urls[0]?.normalized).toBe('example.com');
  });

  it('does not treat "Rs. 500" or "e.g." as a URL', () => {
    expect(extractUrls('Rs. 500 paid. e.g. this one')).toEqual([]);
  });

  it('finds IP-host URLs', () => {
    const urls = extractUrls('Verify at http://192.168.1.10/secure');
    expect(urls).toHaveLength(1);
    expect(urls[0]?.normalized).toContain('192.168.1.10');
  });

  it('captures the whole authority after a userinfo @ marker', () => {
    const text = 'http://paypal.com@evil-phishing.xyz/collect';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(1);
    expect(urls[0]?.normalized).toBe('http://paypal.com@evil-phishing.xyz/collect');
    expect(text.slice(urls[0]!.start, urls[0]!.end)).toBe(text);
  });

  it('does not treat script text as a URL', () => {
    expect(extractUrls('आपका बैंकरूल्प卡 500 है')).toEqual([]);
  });

  it('finds multiple URLs in one message', () => {
    expect(extractUrls('a at one.com and b at two.org')).toHaveLength(2);
  });

  it('detects an input that is a single URL', () => {
    expect(isWholeInputUrl('https://example.com/path?a=1')).toBe(true);
    expect(isWholeInputUrl('Please visit https://example.com/path')).toBe(false);
    expect(isWholeInputUrl('short')).toBe(false);
  });
});

describe('registrable domain', () => {
  it('handles two-level public suffixes', () => {
    expect(getRegistrableDomain('a.b.sbi.co.in')).toBe('sbi.co.in');
    expect(getRegistrableDomain('mail.incometax.gov.in')).toBe('incometax.gov.in');
    expect(getRegistrableDomain('x.y.nhs.uk')).toBe('nhs.uk');
    expect(getRegistrableDomain('a.b.com.au')).toBe('b.com.au');
  });

  it('falls back to two labels', () => {
    expect(getRegistrableDomain('www.example.com')).toBe('example.com');
    expect(getRegistrableDomain('paypal.com.secure-login.xyz')).toBe('secure-login.xyz');
  });

  it('strips the port and trailing dot', () => {
    expect(getRegistrableDomain('example.com:8080')).toBe('example.com');
  });
});

describe('static URL checks', () => {
  it('flags an IP host', () => {
    const url = urlOf('http://192.168.1.10/secure');
    expect(hasCheck(url, 'ip_host')).toBe(true);
    expect(url.suspicious).toBe(true);
  });

  it('does not flag a normal domain host', () => {
    const url = urlOf('https://example.com/page');
    expect(hasCheck(url, 'ip_host')).toBe(false);
  });

  it('flags punycode hosts', () => {
    const url = urlOf('https://xn--bcher-kva.example/x');
    expect(hasCheck(url, 'punycode_host')).toBe(true);
  });

  it('flags mixed-script hosts', () => {
    const url = urlOf('https://pаypal.com/x');
    expect(hasCheck(url, 'mixed_script_host')).toBe(true);
  });

  it('does not flag a purely ASCII host', () => {
    expect(hasCheck(urlOf('https://paypal.com/x'), 'mixed_script_host')).toBe(false);
  });

  it('flags the userinfo @ trick', () => {
    const url = urlOf('http://paypal.com@evil-phishing.xyz');
    expect(hasCheck(url, 'userinfo_at')).toBe(true);
    expect(url.host).toBe('evil-phishing.xyz');
  });

  it('flags known shorteners', () => {
    expect(hasCheck(urlOf('https://bit.ly/abc123'), 'shortener')).toBe(true);
    expect(hasCheck(urlOf('https://example.com/x'), 'shortener')).toBe(false);
    expect(SHORTENERS.has('bit.ly')).toBe(true);
  });

  it('flags excessive subdomains', () => {
    expect(hasCheck(urlOf('https://a.b.c.d.example.com/x'), 'many_subdomains')).toBe(true);
    expect(hasCheck(urlOf('https://example.com/x'), 'many_subdomains')).toBe(false);
  });

  it('flags a brand name used on a domain that does not own it', () => {
    const url = urlOf('https://paypal.com.secure-login.xyz');
    expect(hasCheck(url, 'brand_not_in_domain')).toBe(true);
    expect(url.registrableDomain).toBe('secure-login.xyz');
  });

  it('flags risky TLDs', () => {
    expect(hasCheck(urlOf('https://example.xyz/x'), 'risky_tld')).toBe(true);
    expect(hasCheck(urlOf('https://example.com/x'), 'risky_tld')).toBe(false);
    expect(RISKY_TLDS.has('xyz')).toBe(true);
  });

  it('flags plain http', () => {
    expect(hasCheck(urlOf('http://example.com/x'), 'plain_http')).toBe(true);
    expect(hasCheck(urlOf('https://example.com/x'), 'plain_http')).toBe(false);
  });

  it('flags very long URLs', () => {
    const long = `https://example.com/${'a'.repeat(250)}`;
    expect(hasCheck(urlOf(long), 'long_url')).toBe(true);
    expect(hasCheck(urlOf('https://example.com/x'), 'long_url')).toBe(false);
  });

  it('flags hyphen- and digit-heavy hosts', () => {
    expect(hasCheck(urlOf('https://pay-pal-secure-login.xyz'), 'many_hyphens')).toBe(true);
    expect(hasCheck(urlOf('https://pay123456pal.com'), 'many_digits')).toBe(true);
    expect(hasCheck(urlOf('https://paypal.com'), 'many_hyphens')).toBe(false);
  });

  it('flags look-alike domains by folded Levenshtein distance', () => {
    const url = urlOf('https://paypa1.com/login');
    expect(hasCheck(url, 'lookalike_domain')).toBe(true);
    expect(url.lookalikeOf).toContain('paypal');
  });

  it('does not flag an exact brand domain as a look-alike', () => {
    expect(hasCheck(urlOf('https://paypal.com'), 'lookalike_domain')).toBe(false);
    expect(hasCheck(urlOf('https://amazon.in/x'), 'lookalike_domain')).toBe(false);
  });

  it('treats an exact known domain as trusted and unflagged', () => {
    const url = urlOf('https://www.hdfcbank.com/secure');
    expect(url.trusted).toBe(true);
    expect(url.suspicious).toBe(false);
    expect(url.score).toBe(0);
    expect(TRUSTED_DOMAINS.has('hdfcbank.com')).toBe(true);
  });

  it('does not treat a look-alike of a trusted domain as trusted', () => {
    const url = urlOf('https://hdfcbank-verify.co.in');
    expect(url.trusted).toBe(false);
    expect(hasCheck(url, 'brand_not_in_domain')).toBe(true);
  });

  it('scores a structurally clean URL below the suspicious threshold', () => {
    const url = urlOf('https://example.org/some/page');
    expect(url.suspicious).toBe(false);
    expect(url.score).toBeLessThan(0.5);
  });

  it('always attaches a verdict string', () => {
    expect(urlOf('https://paypal.com.secure-login.xyz').verdict.length).toBeGreaterThan(10);
    expect(urlOf('https://www.hdfcbank.com').verdict.length).toBeGreaterThan(10);
  });
});

describe('similarity helpers', () => {
  it('computes Levenshtein distance', () => {
    expect(levenshtein('paypal', 'paypal')).toBe(0);
    expect(levenshtein('paypal', 'paypa1')).toBe(1);
    expect(levenshtein('abc', 'xyz')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('normalizes structure before comparing', () => {
    expect(structuralNormalize('HTTPS://WWW.Example.COM:8080/Path/')).toBe('example.com');
  });

  it('folds leet digits and drops non-letters', () => {
    expect(foldForLookalike('p4yp4l')).toBe('paypal');
    expect(foldForLookalike('pay-pal')).toBe('paypal');
    expect(foldForLookalike('paypal.com')).toBe('paypalcom');
  });

  it('recognises look-alikes but not exact matches or far-off names', () => {
    expect(isLookalike('paypa1.com', BRAND_NAMES).lookalike).toBe(true);
    expect(isLookalike('paypai.com', BRAND_NAMES).lookalike).toBe(true);
    expect(isLookalike('paypal.com', BRAND_NAMES).lookalike).toBe(false);
    expect(isLookalike('amazon.in', BRAND_NAMES).lookalike).toBe(false);
    expect(isLookalike('totally-unrelated-host.com', BRAND_NAMES).lookalike).toBe(false);
  });
});
