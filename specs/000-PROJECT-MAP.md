# GuideRail — Project Map (the one mental picture)

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                      CHILD'S BROWSER                     │
                    │                                                          │
                    │  content scripts          service worker                 │
                    │  ┌─────────────────┐      ┌───────────────────────────┐  │
                    │  │ metadata extract │─msg─▶│ policy pipeline (004)     │  │
                    │  │ blur blanket(006)│◀─────│  hours→pack→gate→classify │  │
                    │  │ extractAndSanitize      │ WASM core (001)           │  │
                    │  │  (012/013 shared)│      │  aho-corasick + sanitize()│  │
                    │  └─────────────────┘      │ quiz gate + tokens (005)  │  │
                    │        quiz_gate.html      │ profiles (011) DNR alarms │  │
                    │        rules screen (007)  └─────────────┬─────────────┘  │
                    └───────────────────────────────────────── │ ───────────────┘
                                    sanitized text only ▼      │ aggregates only
                    ┌──────────────────────────────────────────────────────────┐
                    │                 EDGE (Cloudflare Workers)                │
                    │  llm-proxy (008): auth·caps·cache·PII-recheck·routing    │
                    │  accounts+sync (009) · billing webhooks (010)            │
                    │  digest cron (016)                                       │
                    └───────────────┬──────────────────────────┬───────────────┘
                                    ▼                          ▼
                    ┌──────────────────────┐    ┌──────────────────────────────┐
                    │ PARENT'S PHONE        │    │ PROVIDERS                    │
                    │ dashboard (014)       │    │ LLM APIs (zero-retention)    │
                    │ ask-to-unlock (015)   │    │ Paddle/LS + Razorpay (010)   │
                    │ Sunday digest (016)   │    │ email (Resend/SES)           │
                    └──────────────────────┘    └──────────────────────────────┘

   INVARIANTS (hold in every phase):
   • No raw child data crosses the dotted line — sanitize() is the only exit.
   • Client never trusted for entitlements; server never trusted with PII.
   • Filtering works with the entire right half of this diagram turned off.
```

## Phase ladder

| Phase | Name | Specs | What exists after | Money |
|---|---|---|---|---|
| 1 | Private Beta | 001–007 | The core loop, offline-capable, one child, zero backend | Free |
| 2 | Family Launch | 008–016 | Backend, accounts, AI features, dashboard, payments | Family plan |
| 3 | Community | (017+) | Co-op allowlists+admin, more packs, Hinglish, BYOK, Edge | Co-op plan |
| 4 | Institutional | (02x) | Managed deploy, fail-closed, admin console, teacher view | B2B |

**Phase 4 note (CIPA):** Institutional profile is CIPA-aware by design: baseline harmful-content blocking categories (obscene/CSAM/harmful-to-minors) layer beneath curriculum packs, and monitoring is satisfied via aggregate reporting — not surveillance (posture ADR planned for Phase 4).

## Phase 2 build order & dependencies

| # | Spec | Depends on | Gate |
|---|------|-----------|------|
| 008 | LLM Proxy | Phase 1 done | — |
| 009 | Accounts & Sync | 008 (shared infra) | — |
| 010 | Payments | 009 | — |
| 011 | Multi-Child Profiles | 009 | — |
| 012 | LLM Quiz Generation | 008, 009, 011 | **COPPA/DPDP review + ADR-0002 Accepted** |
| 013 | Worksheet Engine | 012 (shared extraction) | same gate |
| 014 | Parent Dashboard | 009, 010, 011 | — |
| 015 | Ask-to-Unlock | 014, 005 machinery | — |
| 016 | Weekly Digest | 009, 011 | — |

Parallelizable: 010/011 after 009 · 014 alongside 012/013 · 015/016 last.
Business gate before ANY of Phase 2: validation report's beta condition met (≥5 families, ≥3 would-pay).

## ADR ledger (planned)
0001 fail-open/fail-closed as config · 0002 VU#595768 threat model · 0003 classification architecture ·
0004 pack format & trust · 0005 token & revocation · 0006 proxy trust & cost · 0007 identity: no child accounts ·
0008 billing rails · 0009 grounding & child-facing AI safety

## The three sentences that ARE the project
1. Rust in the browser, TypeScript at the edge, Next.js for the parent — Rust only where it's load-bearing.
2. A blocked page becomes a lesson; earned time replaces nagging; the child can always see the rules.
3. Privacy, cost structure, and the Securly interview story are the same architectural fact: classification never leaves the device.
