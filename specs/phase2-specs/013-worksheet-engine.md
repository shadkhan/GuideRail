# Spec: Worksheet Engine — page → printable worksheet + answer key
Status: Draft · Date: 2026-07-17 · ADRs: extends ADR-0009 grounding contract

## Goal (one sentence, user-visible outcome)
A parent clicks one button on any page their child studied and gets a clean, printable worksheet with an answer key — the teaching-assistant half of the product promise.

## Requirements (numbered, testable)
R1. Trigger: extension popup button (parent context, PIN-gated during study hours) on the active tab; uses the same readability extraction + WASM sanitize pipeline as spec 012 — one shared `extractAndSanitize()` module, not a copy.
R2. Proxy `/v1/worksheet` returns structured JSON: {title, summary_1line, sections[{heading, items[]}], quiz[{q, options, answer}], vocabulary[]} — schema-validated (spec 008 R6); grounded: vocabulary and quiz items carry source snippets verified client-side like spec 012 R3.
R3. Render: markdown → print-styled HTML (worksheet page + separate answer-key page) → browser print-to-PDF; A4 default, US Letter toggle; no server-side PDF generation.
R4. Cache-first UX: URL-hash cache (spec 008 R3) means popular pages return instantly; show "generated Xs ago" on cache hits with a regenerate option (counts against quota).
R5. Quota: free 2/month, family unlimited-soft-capped (spec 008 R2); child profiles never see this feature at all.
R6. Recent worksheets list (last 10) in parent settings with re-print; stored device-local only.
R7. Failure UX: extraction-too-thin (<300 words) → honest "not enough content on this page" message, no LLM call wasted.

## Out of scope
- Multi-page/site-wide worksheets; editing UI (regenerate only); DOCX export; assignment/sharing (Phase 3 co-op)

## Acceptance criteria (how "done" is proven)
- [ ] Test: schema validation + grounding checks, quota decrement/refusal, thin-page path, shared-module invariant (grep: one extractAndSanitize)
- [ ] Evidence: printed PDF (both pages) from a real Khan Academy article — visually reviewed, no ads/nav leakage in content
- [ ] Evidence: cache-hit recording — second request for same URL returns <500ms with zero proxy LLM log entry
- [ ] Evidence: token counts on the 10-page corpus reused from spec 012 (same ≥65% metric applies)

## Open questions (must be empty before Status: Approved)
- Q1: Worksheet tone/format defaults per grade_band — one template v1 or per-band variants (recommend one, iterate on beta feedback)?
- Q2: Hindi-medium page handling v1 — refuse politely or best-effort English worksheet? (Full Hinglish support is Phase 3.)
