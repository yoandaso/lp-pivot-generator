import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { readTextWithLimit } from './costGuards.js';

// /api/analyze が取得する外部ページの上限
export const FETCH_LIMITS = {
  maxUrlLength: 2048,
  maxBytes: 512 * 1024,
  maxRedirects: 3,
  timeoutMs: 15000,
};

function isPrivateIPv4(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateAddress(ip) {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIPv4(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(lower);
  }
  return true;
}

// 自サイト（自オリジン）へのリクエストを拒否するためのホスト一覧
export function getOwnHosts(request) {
  const hosts = new Set();
  const host = request?.headers?.get('host');
  if (host) hosts.add(host.toLowerCase().split(':')[0]);
  for (const value of [process.env.NEXT_PUBLIC_BASE_URL, process.env.VERCEL_URL]) {
    if (!value) continue;
    try {
      hosts.add(new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase());
    } catch {}
  }
  return hosts;
}

// 同期的に判定できる URL チェック（プロトコル、長さ、自サイト、明らかな内部ホスト）
export function validateTargetUrl(rawUrl, ownHosts = new Set()) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    return { error: 'URLが指定されていません' };
  }
  if (rawUrl.length > FETCH_LIMITS.maxUrlLength) {
    return { error: 'URLが長すぎます' };
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { error: '有効なURLを入力してください' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { error: 'httpまたはhttpsのURLを入力してください' };
  }
  if (parsed.username || parsed.password) {
    return { error: '有効なURLを入力してください' };
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    return { error: 'このURLは分析できません' };
  }
  if (isIP(hostname) && isPrivateAddress(hostname)) {
    return { error: 'このURLは分析できません' };
  }
  if (ownHosts.has(hostname)) {
    return { error: 'このURLは分析できません' };
  }
  return { url: parsed };
}

async function assertPublicHost(hostname, lookupFn) {
  const bare = hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(bare) ? [{ address: bare }] : await lookupFn(bare, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('このURLは分析できません');
  }
}

// 外部ページを取得する。リダイレクト回数・サイズ・時間に上限あり
export async function fetchExternalPage(rawUrl, { ownHosts = new Set(), fetchFn = fetch, lookupFn = lookup } = {}) {
  const signal = AbortSignal.timeout(FETCH_LIMITS.timeoutMs);
  let current = rawUrl;

  for (let redirects = 0; redirects <= FETCH_LIMITS.maxRedirects; redirects++) {
    const checked = validateTargetUrl(current, ownHosts);
    if (checked.error) throw new Error(checked.error);
    await assertPublicHost(checked.url.hostname, lookupFn);

    const response = await fetchFn(checked.url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
      signal,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      response.body?.cancel().catch(() => {});
      current = new URL(response.headers.get('location'), checked.url).toString();
      continue;
    }

    if (!response.ok) {
      response.body?.cancel().catch(() => {});
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return readTextWithLimit(response.body, FETCH_LIMITS.maxBytes, { truncate: true });
  }

  throw new Error('リダイレクトが多すぎます');
}
