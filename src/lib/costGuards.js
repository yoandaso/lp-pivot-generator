// Production Cost Safety のためのガード群
// docs/PRODUCTION_COST_SAFETY.md を参照

// 固定ウィンドウのレート制限設定
// ai: analyze / pivots / generate-lp で共有する IP 単位の上限
// aiGlobal: 全ユーザー合計の AI 呼び出し上限（コストの最終的な上限）
export const LIMITS = {
  ai: { limit: 30, windowSec: 60 * 60 },
  aiGlobal: {
    limit: Number(process.env.AI_DAILY_CAP) > 0 ? Number(process.env.AI_DAILY_CAP) : 1000,
    windowSec: 24 * 60 * 60,
  },
  saveLp: { limit: 20, windowSec: 60 * 60 },
  saveLpGlobal: { limit: 1000, windowSec: 24 * 60 * 60 },
  generateHtml: { limit: 60, windowSec: 60 * 60 },
  log: { limit: 120, windowSec: 60 * 60 },
};

// リクエストボディの最大バイト数
export const BODY_LIMITS = {
  analyze: 4 * 1024,
  pivots: 32 * 1024,
  generateLp: 32 * 1024,
  lpData: 64 * 1024,
  log: 4 * 1024,
};

const MEMORY_BUCKET_MAX = 10000;
const memoryBuckets = new Map();

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function incrementMemory(key, windowSec, now) {
  if (memoryBuckets.size > MEMORY_BUCKET_MAX) {
    for (const [k, v] of memoryBuckets) {
      if (v.resetAt <= now) memoryBuckets.delete(k);
    }
    if (memoryBuckets.size > MEMORY_BUCKET_MAX) memoryBuckets.clear();
  }
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
}

// Redisがあれば全インスタンス共通、なければ（または障害時は）インスタンス内メモリで数える
export async function hitRateLimit(redis, name, id, { limit, windowSec }, now = Date.now()) {
  const windowIndex = Math.floor(now / (windowSec * 1000));
  const key = `rl:${name}:${id}:${windowIndex}`;
  const retryAfter = Math.max(1, Math.ceil(((windowIndex + 1) * windowSec * 1000 - now) / 1000));

  let count;
  if (redis) {
    try {
      const results = await redis.multi().incr(key).expire(key, windowSec).exec();
      count = Number(results?.[0]?.[1]);
    } catch (error) {
      console.error('Rate limit redis error, falling back to memory:', error.message);
    }
  }
  if (!Number.isFinite(count)) {
    count = incrementMemory(key, windowSec, now);
  }

  return { allowed: count <= limit, count, limit, retryAfter };
}

export function resetMemoryRateLimits() {
  memoryBuckets.clear();
}

function tooManyRequests(result, message) {
  return Response.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
  );
}

// 通常のエンドポイント用: 超過時は 429 の Response、許可時は null
export async function enforceRateLimit(redis, request, name) {
  const result = await hitRateLimit(redis, name, getClientIp(request), LIMITS[name]);
  if (!result.allowed) {
    return tooManyRequests(result, 'リクエストが多すぎます。しばらく待ってから再度お試しください。');
  }
  return null;
}

// 全ユーザー合計の日次上限（入力検証を通ったリクエストだけを数える）
export async function enforceGlobalCap(redis, name) {
  const result = await hitRateLimit(redis, name, 'all', LIMITS[name]);
  if (!result.allowed) {
    return tooManyRequests(result, '本日の利用上限に達しました。明日再度お試しください。');
  }
  return null;
}

// AI 呼び出し直前に確認する全体の日次上限
export function enforceAiGlobalCap(redis) {
  return enforceGlobalCap(redis, 'aiGlobal');
}

// ボディをバイト上限付きで読み込み JSON として返す
// 戻り値: { data } または { response }（エラー時の Response）
export async function readJsonBody(request, maxBytes) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { response: Response.json({ error: 'リクエストが大きすぎます' }, { status: 413 }) };
  }

  const text = await readTextWithLimit(request.body, maxBytes);
  if (text === null) {
    return { response: Response.json({ error: 'リクエストが大きすぎます' }, { status: 413 }) };
  }

  try {
    return { data: JSON.parse(text) };
  } catch {
    return { response: Response.json({ error: 'リクエストボディのパースに失敗しました' }, { status: 400 }) };
  }
}

// ストリームを最大 maxBytes まで読む。超えたら null（truncate: true なら切り詰めて返す）
export async function readTextWithLimit(stream, maxBytes, { truncate = false } = {}) {
  if (!stream) return '';
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (total + value.byteLength > maxBytes) {
        if (!truncate) return null;
        chunks.push(value.subarray(0, maxBytes - total));
        total = maxBytes;
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}

// プロンプトに埋め込む値の長さ・件数の上限
export function clampText(value, maxLength) {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'string' ? value : String(value);
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

export function clampList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => clampText(item, maxLength));
}

// 本番環境ではデバッグ用エンドポイントを 404 にする
export function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

export function debugRouteGuard() {
  if (isProductionRuntime()) {
    return Response.json({ error: 'Not Found' }, { status: 404 });
  }
  return null;
}
