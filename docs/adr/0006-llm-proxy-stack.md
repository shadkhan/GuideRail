# ADR-0006 — llm-proxy: TypeScript + Hono on Cloudflare Workers

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** GuideRail author
- **Consulted:** —
- **Supersedes:** —

<!-- Renumbered from ADR-0003 → ADR-0006 during spec 001 implementation:
     the phase-1 index and specs/000-PROJECT-MAP.md reserve 0003 for the
     classification-architecture decision (produced by this spike), and the
     project-map ADR ledger lists 0006 as the proxy trust & cost slot. Content
     is unchanged; only the number moved. -->

## Context

Phase-2 introduces `services/llm-proxy` — a single metered pipe in front of
whichever LLM provider we route to. Its responsibilities are narrow:
authenticate the calling extension, enforce per-account rate/spend caps, look
up a cache-by-content-hash entry, and (on miss) make one outbound LLM call.
Payloads are small (client-sanitized text per ADR-0002), request latency is
dominated by ~2 s of LLM wait, and target load is beta-scale (dozens of
families, at most a few requests per family per day).

We already commit to Rust for the WASM classifier where sub-16.6 ms budgets
matter (per CLAUDE.md and spec 001) and TypeScript for the extension shell.
The remaining question is what runtime and framework this thin server-side
layer should use — a choice whose reversal cost grows once auth, billing
webhooks, and the accounts service (spec 009) all land on the same runtime.

## Decision

We will implement `services/llm-proxy` in **TypeScript using Hono on Cloudflare
Workers**. Production deploys to `guiderail-proxy.workers.dev` (or a custom
subdomain once one is procured); preview deploys per PR via `wrangler deploy
--env preview`. Secrets (LLM API keys, per-account cap counters) via Workers
env bindings and KV. All business logic lives in framework-agnostic modules
with a thin Workers adapter, keeping the exit path (see reversal below) cheap.

## Alternatives

- **FastAPI (Python) on a VPS.** Rejected: adds TLS renewal, SSH ops, and OS
  patching for ~200 LOC of logic; Python-on-Workers is still second-class.
  Justified only if we later add real Python ML (e.g., embeddings for pack
  curation) — that would be its own service, not the proxy.
- **Rust with Axum or workers-rs.** Rejected: the proxy has no performance
  problem to solve — it spends 2 s awaiting an LLM per request. Rust would
  earn nothing here and burn the "Rust where it matters" narrative on a place
  where it doesn't. workers-rs specifically is less mature than TS Workers.
- **Node.js on a managed host (Fly.io / Railway / Render).** Rejected: adds a
  monthly bill and cold-start latency; Workers' free tier (100 k req/day)
  covers beta and early paid usage at $0.

## Consequences

### Positive

- **$0 at beta scale.** Workers free tier handles 100 k req/day; no card
  needed until real traffic.
- **Deploy in seconds.** `wrangler deploy` — no VPS, no TLS certs, no OS
  patching, no reverse proxy config.
- **Edge latency.** Cloudflare's ~300 PoPs help India and rural US users vs.
  a single-region VPS.
- **Native TypeScript.** The extension's typed message schema
  (`packages/extension/src/messages.ts`) can share request/response types with
  the proxy via a workspace package.
- **Narrative coherence.** "Rust where the sub-16 ms budget is load-bearing,
  TypeScript where deploy-speed and $0 ops matter" — a defensible split that
  reads as thoughtful, not opportunistic.

### Negative

- **Workers runtime constraints.** No Node built-ins by default (`crypto`,
  `fs`, and friends require opt-in flags or aren't available). Some npm
  packages are incompatible. Some LLM SDKs assume Node — may need to call the
  provider's REST API directly rather than use their SDK.
- **Cold starts are fast (~5–10 ms) but not zero.** If we ever need
  server-side p95 < 5 ms (we don't now), this becomes a constraint.
- **Vendor lock-in to Cloudflare.** KV, cron triggers, Durable Objects, and
  binding syntax are Workers-specific. Business logic in framework-agnostic
  modules mitigates this but does not eliminate it.
- **Remote debugging.** `wrangler tail` is the primary loop — worse dev
  ergonomics than a local FastAPI or Express server with breakpoints.

### Reversal

Feasible. The proxy sits behind a single HTTP interface consumed only by the
extension's typed network layer. Swapping the runtime (to FastAPI-on-VPS,
Node-on-Fly, Rust-on-Fly, etc.) is a rewrite of one service, not a
client-side change. Estimated cost: 1–2 days if we need to move.

## Interview note (optional)

"Two languages on one axis: Rust where a sub-16 ms budget is load-bearing,
TypeScript where deploy-speed and $0 ops matter. FastAPI would have cost me a
VPS and a TLS-renewal calendar entry for a 200-line service that spends two
seconds waiting on OpenAI. Save the Rust for where it earns its keep."
