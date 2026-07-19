# Phase 1 Specs — Build Order & Dependencies

| # | Spec | Depends on | Produces ADR | User-visible? |
|---|------|-----------|--------------|---------------|
| 001 | WASM Core Spike | — | ADR-0003 | No (portfolio evidence) |
| 002 | Extension Scaffold | 001 | — | No |
| 003 | Curriculum Pack Schema | 001, 002 | ADR-0004 | Indirectly |
| 004 | Filtering Engine | 002, 003 | (implements ADR-0001) | Yes — clean schoolwork |
| 005 | Quiz Gate & Earned Time | 004 | ADR-0005 | Yes — the soul |
| 006 | Blur Blanket | 004 | (implements L-002) | Yes |
| 007 | Onboarding & Rules Screen | 003, 004, 005 | — | Yes — first 10 minutes |

Strict order: 001 → 002 → 003 → 004, then 005/006 in parallel, 007 last.
Write ADR-0001 (fail-open/fail-closed) and ADR-0002 (VU#595768 threat model) BEFORE 004 — they are design inputs, not outputs.

Session recipe per spec: fresh session → plan mode → "Implement specs/NNN-*.md" → spec-reviewer → evidence → knowledge-capture → mark Status: Implemented.
