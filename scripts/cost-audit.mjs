// Production Cost Safety の静的チェック（npm run cost:audit）
// docs/PRODUCTION_COST_SAFETY.md の方針をコードに対して機械的に確認する
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(root, 'src/app');
const libDir = join(root, 'src/lib');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(js|jsx|mjs|ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const files = [...walk(appDir), ...walk(libDir)].map((file) => ({
  file,
  rel: relative(root, file),
  src: readFileSync(file, 'utf8'),
}));
const isClient = (src) => /^\s*['"]use client['"]/.test(src);
const isRoute = (rel) => /\/route\.(js|ts)$/.test(rel);

// 意図的に許可している例外（理由は docs/PRODUCTION_COST_SAFETY.md に記載）
const ALLOW = {
  whileTrue: new Set(['src/lib/costGuards.js']),
  anthropicSdk: new Set(['src/lib/anthropic.js']),
  dynamic: new Set([]),
};

const failures = [];
const fail = (rel, message) => failures.push(`${rel}: ${message}`);

for (const { rel, src } of files) {
  const server = !isClient(src);

  // 1. サーバー側から自サイトへの HTTP 自己呼び出し
  if (server) {
    const selfFetch = /(fetch|axios[.\w]*|got|ky)\s*\(\s*[`'"]?[^)]*(NEXT_PUBLIC_BASE_URL|NEXT_PUBLIC_SITE_URL|SITE_URL|APP_URL|BASE_URL|VERCEL_URL|localhost|127\.0\.0\.1|lp-pivot\.com)/;
    if (selfFetch.test(src)) fail(rel, 'server-side fetch to own origin');
  }

  // 2. 上限のないループ
  if (/while\s*\(\s*true\s*\)/.test(src) && !ALLOW.whileTrue.has(rel)) {
    fail(rel, 'while (true) outside allowlist');
  }

  // 3. SDK の直接生成（リトライ・タイムアウト上限を迂回する）
  if ((/new Anthropic\(/.test(src) || /api\.anthropic\.com/.test(src)) && !ALLOW.anthropicSdk.has(rel)) {
    fail(rel, 'Anthropic client created outside src/lib/anthropic.js');
  }

  // 4. 公開コンテンツの意図しない動的化
  if (/export const dynamic\s*=\s*['"]force-dynamic['"]|export const revalidate\s*=\s*0\b/.test(src) && !ALLOW.dynamic.has(rel)) {
    fail(rel, 'force-dynamic / revalidate = 0 without allowlist entry');
  }

  if (!isRoute(rel)) continue;

  // 5. AI を呼ぶルートはレート制限・全体上限・実行時間上限が必須
  if (/callClaudeWithRetry|createAnthropicClient/.test(src)) {
    if (!/enforceRateLimit\(\s*redis\s*,\s*request\s*,\s*['"]ai['"]\s*\)/.test(src)) fail(rel, 'AI route without per-IP rate limit');
    if (!/enforceAiGlobalCap\(/.test(src)) fail(rel, 'AI route without global daily cap');
    if (!/export const maxDuration\s*=\s*\d+/.test(src)) fail(rel, 'AI route without maxDuration');
    const capIndex = src.indexOf('enforceAiGlobalCap(');
    const callIndex = src.indexOf('callClaudeWithRetry(anthropic');
    if (capIndex === -1 || callIndex === -1 || capIndex > callIndex) fail(rel, 'global cap must be checked before provider call');
  }

  // 6. POST ボディは上限付きで読む
  if (/export async function POST/.test(src)) {
    if (/request\.(json|text|arrayBuffer|formData)\(\)/.test(src)) fail(rel, 'unbounded request body read');
    if (!/readJsonBody\(/.test(src)) fail(rel, 'POST route without readJsonBody');
    if (!/enforceRateLimit\(/.test(src)) fail(rel, 'POST route without rate limit');
  }

  // 7. 共有LPの保存（外部ストレージへの書き込み）は全体上限が必須
  if (/redis\.set\(/.test(src) && !/enforceGlobalCap\(\s*redis\s*,\s*['"]saveLpGlobal['"]\s*\)/.test(src)) {
    fail(rel, 'storage write without global daily cap');
  }

  // 8. デバッグ用ルートは本番で無効
  if (/src\/app\/api\/(test-|debug-)/.test(rel) && !/debugRouteGuard\(\)/.test(src)) {
    fail(rel, 'debug route without debugRouteGuard');
  }
}

// 9. robots ポリシーの存在
if (!existsSync(join(appDir, 'robots.js'))) fail('src/app/robots.js', 'missing robots policy');

if (failures.length > 0) {
  console.error('cost-audit: FAIL');
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}
console.log(`cost-audit: PASS (${files.length} files checked)`);
