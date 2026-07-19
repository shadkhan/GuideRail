# @guiderail/llm-proxy (stub)

Metered LLM pipe in front of whichever provider we route to: authenticate the
calling extension, enforce per-account rate/spend caps, look up a
cache-by-content-hash entry, and on miss make one outbound call. Payloads are
client-sanitized text only (`sanitize()` from core-wasm runs first — no PII ever
leaves the client).

- **Implemented in:** spec 008 (Phase 2).
- **Runtime decided:** ADR-0006 — TypeScript + Hono on Cloudflare Workers.
- **Status:** stub. `src/index.ts` is a placeholder so the workspace resolves.
