# Spec: LLM Proxy v1 — the single metered pipe
Status: Draft · Date: 2026-07-17 · ADRs: will produce ADR-0006 (proxy trust & cost model)

## Goal (one sentence, user-visible outcome)
Every AI feature (quizzes, worksheets) flows through one edge service that enforces caps, caches aggressively, and guarantees the client only ever sends sanitized text — the P&L and the privacy story live here.

## Requirements (numbered, testable)
R1. Hono on Cloudflare Workers; endpoints: `POST /v1/quiz`, `POST /v1/worksheet`, `GET /v1/quota`. Deployed via wrangler with staging + prod environments.
R2. Auth: bearer token issued by accounts service (spec 009); unauthenticated → 401; per-account daily caps enforced in Workers KV (free: 5 quiz + 2 worksheet/day; family: soft-cap 200/day abuse ceiling).
R3. Cache: key = SHA-256(sanitized_text + pack_id + grade_band + type); Workers KV, TTL 30 days; cache hit returns without any LLM call; hit/miss counters exposed on /v1/quota.
R4. Model routing: free tier → budget model route, paid → quality route; provider abstraction behind one interface (swap without endpoint changes); zero-retention/no-training flags set on every provider call.
R5. Input contract: proxy REJECTS (400) any payload failing PII heuristics (email/phone regex re-check server-side) — defense-in-depth behind the client-side WASM scrubber, and proof the contract is enforced, not assumed.
R6. Output contract: quiz JSON schema-validated before return (question/options/answer/topic + source_snippet); invalid model output → one retry → fallback signal so the client uses the local bank. Never forward malformed AI output to a child.
R7. Structured logs (no payload bodies — metadata only: account hash, type, tokens, cache hit, latency); daily cost roll-up queryable.
R8. Rate limit per IP for unauthenticated probes; CORS locked to extension origin + dashboard origin.

## Out of scope
- Streaming responses; multi-turn conversations; any endpoint the extension doesn't need
- Billing logic (spec 010 flips the tier flag; proxy only reads it)

## Acceptance criteria (how "done" is proven)
- [ ] Test: cap enforcement across day boundary, cache determinism, PII-reject cases, malformed-output fallback path
- [ ] Evidence: wrangler prod deploy log; curl transcript showing 401 → authed 200 → cache MISS → identical call cache HIT
- [ ] Cost evidence: logged token counts for 20 real worksheet calls; projected monthly cost at 1k families in ADR-0006
- [ ] ADR-0006 written (provider abstraction, cache key design, why server-side PII re-check exists)

## Open questions (must be empty before Status: Approved)
- Q1: Budget-tier model choice at build time (price/quality moves fast — decide in the spec interview with current pricing).
- Q2: Cache scope — global (all users share cache, max savings) vs per-account (privacy-cleaner)? Recommend global since inputs are sanitized; confirm.
