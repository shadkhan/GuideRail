# Spec: LLM Quiz Generation — grounded, sanitized, fallback-safe
Status: Draft · Date: 2026-07-17 · ADRs: will produce ADR-0009 (grounding & child-facing AI safety)
GATE: COPPA/DPDP review + ADR-0002 threat model must be Accepted before implementation — first spec where child-session text touches a network.

## Goal (one sentence, user-visible outcome)
Paid families get quiz questions generated from the exact pages their child read this morning — provably grounded, PII-scrubbed before leaving the device, and silently falling back to the local bank when offline or capped.

## Requirements (numbered, testable)
R1. Reading capture (paid tier, study hours only): on allow-verdict pages, content script extracts main-content text (readability-style extraction, ads/nav stripped — the 65% token-reduction requirement from the PRD), pipes it through WASM `sanitize()`, stores sanitized excerpt (≤2k tokens) per origin in a rolling 24h device-local buffer.
R2. Quiz request: 2–3 sanitized excerpts (topic-weighted, same selector as spec 005) → proxy `/v1/quiz` → 3 MCQs. Raw page text NEVER stored beyond the sanitized buffer, NEVER sent unsanitized (proxy re-check rejects violations — spec 008 R5).
R3. Grounding contract: every generated question carries `source_snippet` (≤15 words) which MUST be a substring of the submitted excerpt — verified client-side; failure → discard question → bank fallback. Zero hallucinated questions reach a child, structurally.
R4. Fallback ladder: LLM → (invalid/timeout 3s/capped/offline) → local bank (spec 005) → never a broken gate. Fallback reason logged locally.
R5. Free tier: 5 LLM quizzes/month then bank-only, with a gentle upgrade hint on the parent side only — never upsell UI to the child.
R6. Difficulty adapter v1: prompt includes grade_band + last-5 pass rate; grace mode (spec 005 R3) unchanged.
R7. Parent review queue (settings): last 20 generated questions visible with source snippets; one-tap "bad question" flag → excluded + logged for prompt iteration.

## Out of scope
- Cross-day learner modeling; open-ended questions; Hinglish generation (Phase 3); any child-visible AI branding

## Acceptance criteria (how "done" is proven)
- [ ] Test: sanitize-before-buffer invariant, grounding substring check incl. adversarial model output, full fallback ladder, 24h buffer expiry
- [ ] Evidence: recording — child reads a specific article, quiz an hour later asks about THAT article, source snippets shown in parent queue
- [ ] Evidence: token counts before/after DOM cleaning on 10 real pages — ≥65% reduction (PRD metric, now measured)
- [ ] Evidence: airplane-mode run falls back to bank with zero child-visible error
- [ ] ADR-0009 written (grounding contract, why substring-verification over trust, buffer retention choice)

## Open questions (must be empty before Status: Approved)
- Q1: Excerpt buffer retention — 24h fixed or parent-configurable (shorter = more private, weaker weighting)?
- Q2: Should the child ever be told a quiz was AI-generated? (Transparency instinct says yes-in-rules-screen; decide.)
