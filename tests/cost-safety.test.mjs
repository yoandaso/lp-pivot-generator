import { test } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.REDIS_URL;

const {
  LIMITS, BODY_LIMITS, hitRateLimit, enforceRateLimit, enforceAiGlobalCap, enforceGlobalCap, resetMemoryRateLimits,
  readJsonBody, readTextWithLimit, clampText, clampList, debugRouteGuard, getClientIp,
} = await import('../src/lib/costGuards.js');
const { callClaudeWithRetry, createAnthropicClient, CLAUDE_MAX_ATTEMPTS } = await import('../src/lib/anthropic.js');
const { validateTargetUrl, fetchExternalPage, FETCH_LIMITS, isPrivateAddress } = await import('../src/lib/safeFetch.js');
const { default: robots, TRAINING_CRAWLERS } = await import('../src/app/robots.js');

const requestFrom = (ip, init = {}) =>
  new Request('https://lp-pivot.com/api/x', { method: 'POST', headers: { 'x-forwarded-for': ip, ...init.headers }, body: init.body });

const streamOf = (text) => new Response(text).body;

// --- レート制限 ---

test('per-IP AI limit blocks after the configured count', async () => {
  resetMemoryRateLimits();
  for (let i = 0; i < LIMITS.ai.limit; i++) {
    assert.equal(await enforceRateLimit(null, requestFrom('203.0.113.1'), 'ai'), null);
  }
  const blocked = await enforceRateLimit(null, requestFrom('203.0.113.1'), 'ai');
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  // 別 IP は影響を受けない
  assert.equal(await enforceRateLimit(null, requestFrom('203.0.113.2'), 'ai'), null);
});

test('global AI cap blocks after the daily ceiling', async () => {
  resetMemoryRateLimits();
  for (let i = 0; i < LIMITS.aiGlobal.limit; i++) {
    assert.equal(await enforceAiGlobalCap(null), null);
  }
  assert.equal((await enforceAiGlobalCap(null)).status, 429);
});

test('shared LP saves have a global daily cap and a payload ceiling', async () => {
  resetMemoryRateLimits();
  for (let i = 0; i < LIMITS.saveLpGlobal.limit; i++) {
    assert.equal(await enforceGlobalCap(null, 'saveLpGlobal'), null);
  }
  assert.equal((await enforceGlobalCap(null, 'saveLpGlobal')).status, 429);
  assert.ok(BODY_LIMITS.lpData <= 64 * 1024);
});

test('rate limiter uses redis when available and falls back to memory on redis failure', async () => {
  resetMemoryRateLimits();
  const counts = new Map();
  const fakeRedis = {
    multi() {
      let key;
      const chain = {
        incr(k) { key = k; return chain; },
        expire() { return chain; },
        async exec() { counts.set(key, (counts.get(key) ?? 0) + 1); return [[null, counts.get(key)], [null, 1]]; },
      };
      return chain;
    },
  };
  const opts = { limit: 2, windowSec: 60 };
  assert.equal((await hitRateLimit(fakeRedis, 't', 'a', opts, 0)).allowed, true);
  assert.equal((await hitRateLimit(fakeRedis, 't', 'a', opts, 0)).allowed, true);
  assert.equal((await hitRateLimit(fakeRedis, 't', 'a', opts, 0)).allowed, false);

  const brokenRedis = { multi() { throw new Error('down'); } };
  assert.equal((await hitRateLimit(brokenRedis, 'u', 'a', opts, 0)).allowed, true);
  assert.equal((await hitRateLimit(brokenRedis, 'u', 'a', opts, 0)).allowed, true);
  assert.equal((await hitRateLimit(brokenRedis, 'u', 'a', opts, 0)).allowed, false);
  // 次のウィンドウでリセット
  assert.equal((await hitRateLimit(brokenRedis, 'u', 'a', opts, 60_000)).allowed, true);
});

test('client IP is taken from the first x-forwarded-for entry', () => {
  assert.equal(getClientIp(requestFrom('198.51.100.7, 10.0.0.1')), '198.51.100.7');
});

// --- 入力サイズ上限 ---

test('readJsonBody rejects oversized bodies via content-length and via streaming', async () => {
  const big = JSON.stringify({ url: 'x'.repeat(BODY_LIMITS.analyze) });
  const declared = await readJsonBody(requestFrom('1.1.1.1', { body: big, headers: { 'content-length': String(big.length) } }), BODY_LIMITS.analyze);
  assert.equal(declared.response.status, 413);

  const undeclared = await readJsonBody({ headers: new Headers(), body: streamOf(big) }, BODY_LIMITS.analyze);
  assert.equal(undeclared.response.status, 413);

  const ok = await readJsonBody(requestFrom('1.1.1.1', { body: '{"url":"https://example.com"}' }), BODY_LIMITS.analyze);
  assert.deepEqual(ok.data, { url: 'https://example.com' });

  const bad = await readJsonBody(requestFrom('1.1.1.1', { body: '{' }), BODY_LIMITS.analyze);
  assert.equal(bad.response.status, 400);
});

test('readTextWithLimit truncates when requested', async () => {
  assert.equal(await readTextWithLimit(streamOf('abcdef'), 3, { truncate: true }), 'abc');
  assert.equal(await readTextWithLimit(streamOf('abcdef'), 3), null);
});

test('prompt inputs are clamped', () => {
  assert.equal(clampText('a'.repeat(1000), 10).length, 10);
  assert.deepEqual(clampList(Array(50).fill('xx'), 3, 1), ['x', 'x', 'x']);
  assert.deepEqual(clampList('not-a-list', 3, 1), []);
});

// --- プロバイダ呼び出しのリトライ上限 ---

test('Claude calls are capped at CLAUDE_MAX_ATTEMPTS on overload', async () => {
  let calls = 0;
  const client = { messages: { create: async () => { calls++; const e = new Error('overloaded'); e.status = 529; throw e; } } };
  await assert.rejects(callClaudeWithRetry(client, {}, { sleepFn: async () => {} }));
  assert.equal(calls, CLAUDE_MAX_ATTEMPTS);
  assert.ok(CLAUDE_MAX_ATTEMPTS <= 3);
});

test('non-overload errors are not retried', async () => {
  let calls = 0;
  const client = { messages: { create: async () => { calls++; throw new Error('bad request'); } } };
  await assert.rejects(callClaudeWithRetry(client, {}, { sleepFn: async () => {} }));
  assert.equal(calls, 1);
});

test('Anthropic SDK internal retries are disabled and a timeout is set', () => {
  const client = createAnthropicClient({ timeoutMs: 1234 });
  assert.equal(client.maxRetries, 0);
  assert.equal(client.timeout, 1234);
});

// --- 任意URL取得（SSRF・自己呼び出し・サイズ上限） ---

test('internal, own-origin and non-http targets are rejected', () => {
  const own = new Set(['lp-pivot.com']);
  for (const url of [
    'http://localhost:3000/api/analyze',
    'http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.5/',
    'http://[::1]/',
    'https://lp-pivot.com/api/analyze',
    'ftp://example.com/',
    'https://user:pass@example.com/',
    `https://example.com/${'a'.repeat(FETCH_LIMITS.maxUrlLength)}`,
  ]) {
    assert.ok(validateTargetUrl(url, own).error, url);
  }
  assert.ok(validateTargetUrl('https://example.com/', own).url);
  assert.equal(isPrivateAddress('::ffff:192.168.0.1'), true);
  assert.equal(isPrivateAddress('93.184.216.34'), false);
});

const publicLookup = async () => [{ address: '93.184.216.34' }];

test('redirects to internal hosts are blocked', async () => {
  const fetchFn = async () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } });
  await assert.rejects(fetchExternalPage('https://example.com/', { fetchFn, lookupFn: publicLookup }), /分析できません/);
});

test('DNS names resolving to private addresses are blocked', async () => {
  const lookupFn = async () => [{ address: '10.1.2.3' }];
  await assert.rejects(fetchExternalPage('https://evil.example/', { fetchFn: async () => new Response('x'), lookupFn }), /分析できません/);
});

test('redirect chains are capped', async () => {
  let calls = 0;
  const fetchFn = async () => { calls++; return new Response(null, { status: 302, headers: { location: `/r${calls}` } }); };
  await assert.rejects(fetchExternalPage('https://example.com/', { fetchFn, lookupFn: publicLookup }), /リダイレクト/);
  assert.equal(calls, FETCH_LIMITS.maxRedirects + 1);
});

test('fetched page body is capped at maxBytes', async () => {
  const fetchFn = async () => new Response('a'.repeat(FETCH_LIMITS.maxBytes * 3));
  const text = await fetchExternalPage('https://example.com/', { fetchFn, lookupFn: publicLookup });
  assert.equal(text.length, FETCH_LIMITS.maxBytes);
});

// --- デバッグルート・robots ---

test('debug routes are disabled in production', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.equal(debugRouteGuard().status, 404);
  process.env.NODE_ENV = 'development';
  const prevVercel = process.env.VERCEL_ENV;
  delete process.env.VERCEL_ENV;
  assert.equal(debugRouteGuard(), null);
  process.env.NODE_ENV = prev;
  if (prevVercel !== undefined) process.env.VERCEL_ENV = prevVercel;
});

test('robots blocks training crawlers, allows search/user crawlers, and hides /api/', () => {
  const { rules } = robots();
  const ruleFor = (ua) => rules.find((r) => [].concat(r.userAgent).includes(ua));
  assert.deepEqual(TRAINING_CRAWLERS, ['GPTBot', 'ClaudeBot']);
  for (const ua of ['GPTBot', 'ClaudeBot']) assert.equal(ruleFor(ua).disallow, '/');
  for (const ua of ['OAI-SearchBot', 'Claude-SearchBot', 'ChatGPT-User', 'Claude-User']) {
    assert.equal(ruleFor(ua).allow, '/');
    assert.equal(ruleFor(ua).disallow, '/api/');
  }
  assert.equal(ruleFor('*').disallow, '/api/');
});
