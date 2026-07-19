# ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 0001 | Fail-open vs fail-closed is a per-profile configuration | Accepted | 2026-07-19 |
| 0002 | STRIDE threat model for the extension trust boundary (VU#595768) | Accepted | 2026-07-19 |
| 0003 | Classify in Rust-WASM with Aho-Corasick, scrub PII at one regex-lite choke point | Accepted | 2026-07-18 |
| 0004 | Curriculum packs are bundled JSON, hand-validated, with a reserved trust envelope | Accepted | 2026-07-19 |
| 0006 | llm-proxy: TypeScript + Hono on Cloudflare Workers | Accepted | 2026-07-17 |

> **Spec 004 (filtering engine) gate met:** ADR-0001 and ADR-0002 are the
> required design inputs before spec 004; both are now Accepted. Their reasoning
> is grounded in INTERVIEW_BANK IQ-002 (fail-open) and IQ-005 (STRIDE).

## Planned (from `specs/000-PROJECT-MAP.md`)

- 0005 — Token & revocation design (produced by spec 005)
- 0006 — llm-proxy stack (**written**; renumbered here from 0003 during spec 001.
  Absorbs the ledger's "proxy trust & cost" slot — auth/caps/cost live in it.)
- 0007 — Identity: no child accounts
- 0008 — Billing rails
- 0009 — Grounding & child-facing AI safety
- 0010 — YouTube policy: the classroom-playground problem (produced by spec 004
  Amendment A; pack portion informs spec 003 Amendment A). See
  `specs/phase1-specs/004A-youtube-channel-verdicts.md` and `003A-yt-channels-platforms.md`.
