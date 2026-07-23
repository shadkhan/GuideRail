# ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 0001 | Fail-open vs fail-closed is a per-profile configuration | Accepted | 2026-07-19 |
| 0002 | STRIDE threat model for the extension trust boundary (VU#595768) | Accepted | 2026-07-19 |
| 0003 | Classify in Rust-WASM with Aho-Corasick, scrub PII at one regex-lite choke point | Accepted | 2026-07-18 |
| 0004 | Curriculum packs are bundled JSON, hand-validated, with a reserved trust envelope | Accepted | 2026-07-19 |
| 0005 | Earned time is a storage token revoked by chrome.alarms, graded worker-side, forgeable-by-design on unmanaged devices | Accepted | 2026-07-20 |
| 0006 | llm-proxy: TypeScript + Hono on Cloudflare Workers | Accepted | 2026-07-17 |
| 0010 | YouTube verdicts are channel-level, Shorts gate by format, unresolved watches fail closed | Accepted | 2026-07-20 |
| 0011 | Blur activated by an <html> class at document_start, gated by a static trusted set, refined async | Accepted | 2026-07-21 |
| 0012 | Parent PIN is PBKDF2-hashed with an attempt lockout — a speed bump on unmanaged devices, not a vault | Accepted | 2026-07-22 |

> **Spec 004 (filtering engine) gate met:** ADR-0001 and ADR-0002 are the
> required design inputs before spec 004; both are now Accepted. Their reasoning
> is grounded in INTERVIEW_BANK IQ-002 (fail-open) and IQ-005 (STRIDE).

## Planned (from `specs/000-PROJECT-MAP.md`)

- 0006 — llm-proxy stack (**written**; renumbered here from 0003 during spec 001.
  Absorbs the ledger's "proxy trust & cost" slot — auth/caps/cost live in it.)
- 0007 — Identity: no child accounts
- 0008 — Billing rails
- 0009 — Grounding & child-facing AI safety
