# Production Cost Safety

## Executive summary

Final status: **PASS_WITH_EXTERNAL_ACTION**
Release gate: **BLOCKED_EXTERNAL**. The repository work is done, but release should stay blocked until the Vercel Spend Management and Anthropic spend limits (EXT-1, EXT-2) are verified.
Audit date: 2026-09-30

LP PIVOT is a public, unauthenticated Next.js tool. It fetches a user-supplied URL, calls Claude three times per user flow, and stores shareable LPs in Redis. Before this audit, every AI and storage endpoint was open with no rate limit, no provider-call ceiling, no request-size ceiling and up to 15 provider requests per incoming request. The `/api/analyze` URL fetcher could also reach internal/metadata addresses and the app's own origin. Debug endpoints were live in production, and one of them exposed the first 20 characters of Redis/KV environment variables.

All CRITICAL and HIGH findings are fixed in code and covered by `npm run cost:audit`. Per-request work is now bounded. AI calls are also bounded in aggregate by a Redis-backed global daily cap. Monetary blast radius is **not** considered bounded until the provider-level caps in EXT-1/EXT-2 are verified.

## Standard

Standard: PRODUCTION_COST_SAFETY_STANDARD_V1 / 1.0.1
Runbook: PRODUCTION_COST_SAFETY_AUDIT_RUNBOOK_V1 / 1.0.1

## Audit target

Repository: `lp-pivot-generator` (origin `github.com/yoandaso/lp-pivot-generator`)
Branch: `main`
HEAD: `8c4530f3da6508250e13637666b2c7fe043a1308` (audit changes are uncommitted in the worktree)
Initial worktree: clean
Environment: macOS, Node v24.11.0, npm 11.6.1, Next.js 16.0.1 (webpack build), React 19.2.0
Lifecycle: `ACTIVE`, public production at `https://lp-pivot.com` (from `NEXT_PUBLIC_BASE_URL` and `layout.js` OG metadata)

## Architecture

- **Framework/runtime:** Next.js App Router, Node.js runtime for all route handlers. No middleware, no `vercel.json`, empty `next.config.mjs`.
- **Hosting:** Vercel (`@vercel/analytics` is present and `.vercel` is gitignored). No outer CDN/proxy is represented in the repo (see EXT-5).
- **Pages:** `/` is a static client component. `/lp/[id]` is a client component that loads data from `/api/get-lp/[id]` (plus a stray duplicate at `/api/lp/[id]`).
- **AI provider:** Anthropic (`claude-3-5-haiku-20241022`) via `src/lib/anthropic.js`, which is now the only place a client is created.
- **Data store:** Redis Cloud through `ioredis` (`REDIS_URL`), shared from `src/lib/redis.js`. LPs are stored under `lp:<id>` with a 7-day TTL. An in-memory `Map` is used as a per-instance fallback.
- **Outbound fetch:** `/api/analyze` fetches arbitrary user URLs through `src/lib/safeFetch.js`.
- **Unused deps:** `@vercel/blob`, `@vercel/postgres`, `redis`. None are imported.
- **Cron/queues/webhooks/auth:** none.
- **Rate limiting:** added in this audit, in `src/lib/costGuards.js`. It is a Redis fixed window keyed by the first `x-forwarded-for` entry and falls back to per-instance memory.
- **Robots:** `src/app/robots.js`, added in this audit.

## Public route inventory

| Route | Exposure | Render/cache | Origin work | Protection | Response bytes | Result |
|---|---|---|---|---|---|---|
| `GET /` | static public page | STATIC (`s-maxage=31536000`) | none | CDN | 18,786 | PASS |
| `GET /robots.txt` | static public | STATIC | none | CDN | 224 | PASS |
| `GET /lp/[id]` | dynamic public page | ISR (was UNCACHED_DYNAMIC) | 1 fn on first hit per id, then CDN | CDN | 10,171 | PASS |
| `GET /api/lp/[id]` | stray duplicate of `/lp/[id]` | ISR (was UNCACHED_DYNAMIC) | same as above | CDN, robots `Disallow: /api/` | ~10 KB | PASS (LOW F-14) |
| `GET /api/get-lp/[id]` | public API | CACHED_DYNAMIC on 200 (`s-maxage=3600`), 404 uncached | 1 Redis GET | id format check | 38 (404) – ≤64 KB | PASS |
| `POST /api/analyze` | public API, AI + arbitrary URL fetch | PRIVATE_NO_CACHE | ≤4 outbound fetches (≤512 KB body), ≤3 Claude calls | 30/h/IP, 1000/day global, 4 KB body, SSRF/self-fetch guard, `maxDuration=120` | ~2–5 KB | PASS |
| `POST /api/pivots` | public API, AI | PRIVATE_NO_CACHE | ≤3 Claude calls | 30/h/IP (shared), 1000/day global, 32 KB body, field clamps, `maxDuration=120` | ~3–6 KB | PASS |
| `POST /api/generate-lp` | public API, AI | PRIVATE_NO_CACHE | ≤3 Claude calls | 30/h/IP (shared), 1000/day global, 32 KB body, field clamps, `maxDuration=300` | ~15–30 KB | PASS |
| `POST /api/save-lp` | public API, storage write | PRIVATE_NO_CACHE | 1 Redis SET (≤64 KB, 7d TTL) | 20/h/IP, 1000/day global, 64 KB body | ~0.2 KB + echo | PASS |
| `POST /api/generate-html` | public API (unused by the UI) | PRIVATE_NO_CACHE | CPU only | 60/h/IP, 64 KB body | ≤~100 KB | PASS |
| `POST /api/log` | public API | PRIVATE_NO_CACHE | 1 log line | 120/h/IP, 4 KB body | 16 | PASS |
| `GET /api/test-env` | debug | — | none in prod | 404 in production | 21 | PASS (was HIGH) |
| `GET /api/test-redis` | debug | — | none in prod | 404 in production | 21 | PASS (was HIGH) |
| `GET /api/debug-lp/[id]` | debug | — | none in prod | 404 in production | 21 | PASS (was HIGH) |

There are no authenticated pages or APIs, webhooks, cron routes, file/media routes or admin routes.

## Findings

| ID | Severity | Area | Finding | Remediation | Status |
|---|---|---|---|---|---|
| F-01 | CRITICAL | Rate limit / provider | `/api/analyze`, `/api/pivots` and `/api/generate-lp` were unauthenticated, with no rate limit, no provider-call ceiling and no input-size ceiling. Arbitrary body fields were interpolated into prompts, so input tokens were unbounded. | Per-IP limit of 30/h shared across AI routes. Global cap of 1000/day checked just before the provider call (`AI_DAILY_CAP` env override). Body caps of 4/32/32 KB. Per-field length and count clamps. | FIXED |
| F-02 | HIGH | Arbitrary URL fetch / self-fetch | `/api/analyze` followed unlimited redirects. It read the entire response body before truncating, and it could fetch loopback, private and cloud-metadata addresses as well as the app's own origin (SSRF plus self-fetch amplification). | `safeFetch.js`: http(s) only, no credentials in URL, URL ≤2048 chars, own host rejected (`Host`, `NEXT_PUBLIC_BASE_URL`, `VERCEL_URL`), DNS-resolved addresses must be public, manual redirects ≤3 with re-validation, streamed body cap 512 KB, 15 s total timeout. | FIXED |
| F-03 | HIGH | Retry / fan-out | The outer loop made up to 5 attempts and the SDK's default 2 internal retries applied on top, so one request could make up to 15 provider requests, with ~75 s of backoff. There was no `maxDuration`. `/api/pivots` used raw `fetch` with no timeout. | `callClaudeWithRetry`: ≤3 attempts, only on overload, 2 s/4 s backoff. SDK `maxRetries: 0` with an explicit timeout. `maxDuration` 120/120/300 s. All three routes use the shared helper. | FIXED |
| F-04 | HIGH | Storage write | `/api/save-lp` accepted unauthenticated writes of up to the platform body limit (~4.5 MB), each kept in Redis for 7 days, with no rate limit. | 64 KB body cap, 20/h/IP, 1000/day global. Storage ceiling is ≤64 MB/day and ≤448 MB steady state. | FIXED |
| F-05 | HIGH | Public debug endpoints | `/api/test-env` returned the names and first 20 characters of every `REDIS`/`KV`/`UPSTASH` env var. `/api/test-redis` wrote to Upstash on every GET. `/api/debug-lp` proxied Upstash. | `debugRouteGuard()` returns 404 when `NODE_ENV` or `VERCEL_ENV` is `production`. | FIXED (see EXT-6) |
| F-06 | MEDIUM | Log / CPU amplification | `/api/log` and `/api/generate-html` read unbounded bodies with no rate limit, so log volume and CPU were attacker-controlled. | Rate limits of 120/h and 60/h. Body caps of 4 KB and 64 KB. | FIXED |
| F-07 | MEDIUM | Rendering | `/lp/[id]` and `/api/lp/[id]` were server-rendered on every request even though the server output does not depend on data. | `layout.js` with an empty `generateStaticParams`, so each id gets ISR on first hit and CDN hits afterwards. | FIXED |
| F-08 | MEDIUM | Cache | `/api/get-lp/[id]` made one uncached Redis read per request, and any id string was accepted. | 200 responses send `public, max-age=0, s-maxage=3600` (LPs never change after save). Ids must match `^[a-z0-9]{1,32}$`, otherwise 404 with no Redis call. | FIXED |
| F-09 | MEDIUM | Bot policy | No robots policy existed. | `robots.js`: GPTBot and ClaudeBot blocked; search and user crawlers allowed; `/api/` disallowed for all. | FIXED |
| F-10 | MEDIUM | Redis client | `ioredis` connected when the module was imported (including at build time), with no per-command timeout. | `lazyConnect`, `commandTimeout: 3000`, `maxRetriesPerRequest: 2`, error listener. | FIXED |
| F-11 | LOW | Static transfer | `public/image/x_square.ai` (2.8 MB) and `x_square.jpg` (379 KB) are publicly served and not referenced by code. | Recommend removal. Not done, because deleting assets is an owner decision. | OPEN (accepted) |
| F-12 | LOW | Rate-limit durability | If Redis is unavailable, rate limits and global caps fall back to per-instance memory, so the effective global cap multiplies by the number of instances. | Documented. Compensated by EXT-2 (Anthropic spend limit) and EXT-3. | ACCEPTED |
| F-13 | LOW | Client IP | The limiter keys on the first `x-forwarded-for` entry. That is correct when Vercel is the edge, but the meaning changes if a proxy is placed in front. | Documented. See EXT-5. | ACCEPTED |
| F-14 | LOW | Route hygiene | `/api/lp/[id]` is a stray duplicate page under `/api/`. | Now ISR and disallowed in robots. Removal is left to the owner in case older shared links use it. | ACCEPTED |

## Self-fetch

I searched all server code for `fetch(`, axios/got/ky, `NEXT_PUBLIC_BASE_URL`, `VERCEL_URL`, `SITE_URL`, `APP_URL`, `request.origin`, `localhost`, `127.0.0.1` and `lp-pivot.com`.

- `src/app/page.js` and `src/app/lp/[id]/page.js`: all fetches are relative `/api/...` calls from `'use client'` components. These are legitimate client-side calls.
- `save-lp`: `NEXT_PUBLIC_BASE_URL` is only used to build the returned share URL string. There is no fetch.
- `pivots`: raw `fetch('https://api.anthropic.com/...')` was a legitimate external call. It has been replaced by the shared SDK helper.
- `debug-lp` and `test-redis`: Upstash REST calls to an external domain. These are now disabled in production.
- `/api/analyze`: the user-controlled URL could target the app itself. This was a recursion/self-fetch risk. Own hosts are now rejected before and after each redirect.

Result: no accidental server self-fetch remains. Regression protection is `scripts/cost-audit.mjs` rule 1 plus the unit test for own-origin rejection.

## Bounded data

- Redis is only accessed by key (`GET`/`SET`/`INCR`/`EXPIRE`). There are no scans, list-all calls or enumeration.
- There are no list or search endpoints and no SQL. The imported Postgres/Blob packages are unused.
- Per request, fan-out is ≤3 provider calls and ≤4 outbound fetches. There is no `Promise.all` over collections.
- Prompt inputs are clamped: `features` ≤10 items × 300 chars, analysis lists ≤10 items × 500 chars, `selectedPivot` ≤8,000 chars of JSON, fetched HTML ≤30,000 chars.

## Rendering and cache

- There are no `force-dynamic`, `revalidate = 0` or `no-store` usages. The gate enforces this with an empty allowlist.
- `/` and `/robots.txt` are static.
- `/lp/[id]` is ISR (verified locally: first request MISS, second request HIT).
- `/api/get-lp/[id]` is CDN-cached for 1 h on 200. This is safe because shared LPs are intentionally public and never change after save, and there is no per-user data.
- POST APIs are not cached.
- Nothing personalized or auth-sensitive exists to be shared-cached.

## Response size

Measured on the local production build (`next start`, 2026-09-30):

| Route | Status | Body bytes | Cache headers |
|---|---|---:|---|
| `/` | 200 | 18,786 | `s-maxage=31536000`, `x-nextjs-cache: HIT` |
| `/robots.txt` | 200 | 224 | `public, max-age=0, must-revalidate` |
| `/lp/abc123` (cold / warm) | 200 | 10,171 | MISS / HIT, `s-maxage=31536000` |
| `/api/get-lp/<saved id>` | 200 | 23 (test payload; production ≤64 KB) | `public, max-age=0, s-maxage=3600` |
| `/api/get-lp/<unknown>` | 404 | 38 | none |

- AI responses were estimated rather than measured, because the provider was not called locally: `/api/generate-lp` returns ≤~30 KB (bounded by `max_tokens: 8000`), and the others are smaller.
- The largest JS chunk is ~196 KB.
- Every public response is within the 500 KB HTML and 250 KB JSON targets.

## Bot / robots policy

Profile: **normal public web / AEO-visible**. The public landing page should be discoverable by search and AI-search. There is no product requirement for model-training access, so there is no training-crawler exception.

```text
User-Agent: GPTBot, ClaudeBot                                 -> Disallow: /
User-Agent: OAI-SearchBot, Claude-SearchBot, ChatGPT-User, Claude-User -> Allow: /, Disallow: /api/
User-Agent: *                                                 -> Allow: /, Disallow: /api/
```

robots.txt only signals policy. Enforcement on the expensive routes is done by the application rate limits and global caps, and should also be done by Vercel Firewall (EXT-4). `/lp/*` is left crawlable so link-preview bots (e.g. Twitterbot) keep working.

## Rate limiting / abuse controls

| Route | Auth | Rate limit | Concurrency | Provider-call ceiling | Input ceiling | Retry ceiling | Timeout |
|---|---|---|---|---|---|---|---|
| `/api/analyze` | none | 30/h/IP (shared `ai` bucket) | platform | 1000 accepted/day global × ≤3 attempts | 4 KB body, URL ≤2048, page ≤512 KB → 30k chars | 3 (overload only) | fetch 15 s, Claude 90 s, `maxDuration` 120 s |
| `/api/pivots` | none | 30/h/IP (shared) | platform | same global cap | 32 KB body + field clamps | 3 | Claude 90 s, 120 s |
| `/api/generate-lp` | none | 30/h/IP (shared) | platform | same global cap | 32 KB body + field clamps | 3 | Claude 240 s, 300 s |
| `/api/save-lp` | none | 20/h/IP + 1000/day global | platform | — | 64 KB | Redis `maxRetriesPerRequest: 2` | Redis command 3 s |
| `/api/generate-html` | none | 60/h/IP | platform | — | 64 KB | — | platform |
| `/api/log` | none | 120/h/IP | platform | — | 4 KB | — | platform |

How the limiter works:

- It uses a fixed window (`INCR` + `EXPIRE`) on the existing Redis. No new infrastructure was added.
- If Redis fails, it falls back to per-instance memory, which holds at most 10k buckets. It never fails open.
- The global AI cap only counts requests that passed validation, so junk traffic cannot exhaust it. Junk traffic is still limited per IP.
- Rejected requests cost one short function invocation and at most 2 Redis operations.

## Vercel / external controls

- The repo contains no `vercel.json`, Firewall config, middleware, cron, rewrites or custom headers.
- No Vercel CLI or dashboard state was read. All platform controls below are therefore unverified: Spend Management, pause-on-budget, Firewall, Bot Protection, rate-limit rules, and whether an outer CDN/proxy sits in front of `lp-pivot.com`.

## Cost amplification

Per-request bound for one accepted request:

- `/api/analyze`: 1 function (≤120 s), ≤4 outbound HTTP requests (≤512 KB final body), ≤3 Claude requests (~≤15k input tokens, ≤4k output tokens each), 2 Redis INCR.
- `/api/pivots`: 1 function, ≤3 Claude requests (≤3k output tokens), 2 Redis operations.
- `/api/generate-lp`: 1 function (≤300 s), ≤3 Claude requests (≤8k output tokens), 2 Redis operations.
- `/api/save-lp`: 1 function, 2 INCR + 1 SET (≤64 KB).

Retries happen only on overload (529), and overloaded requests do not produce billed tokens.

Traffic multiplier (daily request volume → physical load):

| Route | 1 request | 10k/day | 100k/day | 1m/day |
|---|---|---|---|---|
| `/` (static) | 0 fn, 18.8 KB | 188 MB | 1.9 GB | 18.8 GB transfer (static only) |
| `/lp/[id]` (same ids) | CDN hit, 10 KB | 100 MB | 1 GB | 10 GB |
| `/lp/[id]` (random ids) | 1 fn + 1 ISR write, 10 KB | 10k fn/ISR writes | 100k | 1m fn + 1m ISR writes (linear; needs WAF) |
| `/api/get-lp/[id]` (random ids) | 1 fn + 1 Redis GET, 38 B | 10k fn / 10k GET | 100k / 100k | 1m fn / 1m GET, 38 MB |
| AI routes, abusive traffic | 1 fn + ≤2 Redis ops, <200 B | ≤1000 accepted → ≤3000 Claude requests; rest 429 | same provider ceiling | same provider ceiling; ~1m short fn + ≤2m Redis ops |
| AI routes, provider tokens/day | ≤~23k tokens per call | cap-bound: ≤1000 calls/day ≈ ≤~15M input + ≤8M output tokens | same | same |
| `/api/save-lp` | ≤64 KB write | ≤1000 accepted → ≤64 MB/day | same | same (≤448 MB live with 7-day TTL) |

- **Nonlinear paths removed:** the 15× provider-retry amplification, the unbounded redirect chain and body read, own-origin self-fetch loops, and unbounded storage writes.
- **Monetary blast-radius bound:** not established by the repository alone. At the published Claude Haiku 3.5 rates, the AI cap works out to roughly ≤$50/day, but this is only an approximation, and the cap is per-instance while Redis is down (F-12).
- **What remains linear:** static/ISR transfer and function invocations under very high bot traffic are still linear in request volume. The Vercel Spend Management pause (EXT-1) and the Anthropic spend limit (EXT-2) are what bound total cost.

## Tests and verification

| Command/check | Result |
|---|---|
| `node scripts/cost-audit.mjs` on baseline HEAD (`git stash`) | FAIL, 33 violations (confirms the gate detects the original defects) |
| `npm run cost:audit` (static gate + 18 `node:test` tests) | PASS: gate 22 files, tests 18/18 |
| `npm run build` (`REDIS_URL=` to avoid touching production Redis at build) | PASS |
| `npx eslint src scripts tests` | 6 errors / 2 warnings, all pre-existing in untouched files (`no-html-link-for-pages`, `no-img-element`); identical to the baseline; 0 in changed files |
| Typecheck | N/A (JavaScript project, no `tsconfig`) |
| Existing test suite | N/A (none existed before this audit) |
| Local HTTP smoke (`next start`, `REDIS_URL=` and dummy `ANTHROPIC_API_KEY`, so no production services were touched) | PASS |

Local HTTP smoke results:

- `/` 200 18,786 B
- `/robots.txt` 200
- `/lp/abc123` 200, cold MISS, warm HIT
- debug routes 404
- `analyze` → localhost 400, analyze → 169.254.169.254 400, oversized analyze 413
- `pivots`/`generate-lp` invalid 400 (no provider call)
- `save-lp` round trip 200, then `get-lp` 200 with `s-maxage=3600`
- `save-lp` 70 KB → 413
- the 31st `pivots` request from one IP returned 429 with `Retry-After`

Not executed:

- Real Claude calls, because the provider key was intentionally blanked.
- Behaviour against live Redis Cloud, which was intentionally avoided. The Redis limiter path is covered by a fake-Redis unit test.

## External actions

| ID | Action | Why | Blocking? | Owner |
|---|---|---|---|---|
| EXT-1 | Verify Vercel Spend Management for the team owning the `lp-pivot` project: a budget close to normal spend, **pause production deployments** enabled, alerts going to a monitored inbox. | Standard §5: hard monetary blast radius | **Yes** | Owner (yoandaso) |
| EXT-2 | Set a monthly spend limit (and usage alerts) in the Anthropic Console for the workspace/key used as `ANTHROPIC_API_KEY`. Consider a dedicated workspace for this app. | Provider-level ceiling on AI cost, which also covers F-12 | **Yes** | Owner |
| EXT-3 | Confirm `REDIS_URL` is set for the Production environment in Vercel, so limits are shared across instances. Confirm the Redis Cloud plan is fixed-price with no metered overage and has memory for ≤~450 MB of LPs, or accept that saves fall back to memory once the quota is reached. | Makes rate limits and global caps effective and keeps storage cost bounded | No (high priority) | Owner |
| EXT-4 | In Vercel Firewall, add a rate-limit rule: `POST` on `/api/analyze`, `/api/pivots`, `/api/generate-lp` and `/api/save-lp`, 10 requests per 60 s per IP → 429/deny. Consider a challenge for `/lp/*` and `/api/get-lp/*` bursts. Start in log mode. Do **not** enable the broad "AI bots" deny template unless blocking OAI-SearchBot and Claude-SearchBot is intended. | Enforcement before a function runs; WAF-mitigated traffic is not billed for CDN requests/transfer | No | Owner |
| EXT-5 | (Likely satisfied: on 2026-09-30 `lp-pivot.com` resolved to 216.198.79.1 and responded with `server: Vercel` and `x-vercel-cache`, which points to no outer CDN; verify in the DNS provider.) Confirm DNS for `lp-pivot.com` points directly at Vercel, with no outer CDN/reverse proxy. If one exists, audit the cache chain (§15A) and client-IP forwarding for the limiter. | Cache-chain and IP semantics | No | Owner |
| EXT-6 | If `/api/test-env` was reachable in production (it was public on HEAD `8c4530f`), rotate the Redis Cloud password and any Upstash/KV tokens whose 20-character prefixes may have been exposed. | Credential exposure from a debug endpoint | No (security) | Owner |
| EXT-7 | ~~Commit and deploy~~ **DONE 2026-09-30**: `7df453e` + `68a6fba` deployed to production via Vercel Git integration. The first deploy was rejected by Vercel's vulnerable-Next.js block, so Next was upgraded 16.0.1 → 16.0.11 and React 19.2.0 → 19.2.8. | — | Closed | — |
| EXT-9 | `npm audit` still reports Next.js advisories for versions ≤16.3.2 (image optimizer, rewrites, PPR, Server Actions CSRF). Plan a minor upgrade to a patched 16.x. | Security hygiene; most items do not apply (no `next/image` remotePatterns, rewrites, PPR or Server Actions) | No | Owner |
| EXT-8 | Optional: set the `AI_DAILY_CAP` env var to tune the global AI cap (default 1000/day). | Tunable ceiling | No | Owner |

## Remaining risks

- Total cost is still linear in bot volume for static/ISR/404 traffic until EXT-1 and EXT-4 are in place.
- If Redis is down or unset, limits are per instance only (F-12).
- The limiter uses a fixed window, so a single IP can burst up to 2× its limit across a window boundary.
- Many distinct IPs can each use their per-IP quota. The global cap is the backstop for AI calls and saves; it does not cover `/api/log` or `/api/generate-html`, which are cheap and bounded per request.
- `claude-3-5-haiku-20241022` may be deprecated by the provider. That is a functional risk, not a cost risk, and was left unchanged to avoid altering product behavior.
- F-11 and F-14 are left open as owner decisions.

## Production verification (2026-09-30, after deploy)

- `/` 200, 19,399 B, `x-vercel-cache: HIT`
- `/robots.txt` serves the policy above
- `/api/test-env`, `/api/test-redis`, `/api/debug-lp/x` → 404
- `/api/get-lp/<invalid>` → 404
- `/api/analyze` with a metadata IP → 400
- `/api/pivots` with an invalid body → 400 (no provider call)
- `/lp/abc123`: MISS on the first request, then `x-vercel-cache: HIT` (ISR)

## Changed files

- `package.json`: adds the `cost:audit` script
- `src/lib/redis.js` (new): shared lazy Redis client and memory fallback
- `src/lib/costGuards.js` (new): rate limits, global caps, body caps, input clamps, debug guard
- `src/lib/anthropic.js` (new): bounded Claude client and retry
- `src/lib/safeFetch.js` (new): SSRF/self-fetch-safe bounded page fetch
- `src/app/robots.js` (new)
- `src/app/lp/[id]/layout.js` (new) and `src/app/api/lp/[id]/layout.js` (new): ISR
- `src/app/api/analyze/route.js`, `pivots/route.js`, `generate-lp/route.js`: limits, caps, bounded provider calls
- `src/app/api/save-lp/route.js`, `get-lp/[id]/route.js`: limits, caps, cache headers, id validation, shared Redis
- `src/app/api/log/route.js`, `generate-html/route.js`: limits, body caps
- `src/app/api/test-env/route.js`, `test-redis/route.js`, `debug-lp/[id]/route.js`: disabled in production
- `scripts/cost-audit.mjs` (new): static cost-safety gate
- `tests/cost-safety.test.mjs` (new): 18 regression tests
- `docs/PRODUCTION_COST_SAFETY.md` (new): this file

## Final status

**PASS_WITH_EXTERNAL_ACTION**

All CRITICAL and HIGH findings are fixed and verified in the repository. Production release should stay blocked until EXT-1 (Vercel Spend Management with pause), EXT-2 (Anthropic spend limit) and EXT-7 (deploy) are complete.
