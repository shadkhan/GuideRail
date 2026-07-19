# Spec: Filtering Engine — classification flow & consumer profile policy
Status: Draft · Date: 2026-07-17 · ADRs: implements ADR-0001 (fail-open/fail-closed as config)

## Goal (one sentence, user-visible outcome)
During study hours, schoolwork loads instantly and untouched; entertainment domains route to the quiz gate; everything else fails open (consumer profile) while being classified in the background.

## Requirements (numbered, testable)
R1. Policy pipeline in the service worker, in order: (1) study-hours check (outside hours → no-op), (2) active pack allow_domains fast path, (3) gate-list check (entertainment domains → quiz gate via DNR), (4) WASM classify() on page metadata (title + meta description + URL tokens) for everything else.
R2. Verdicts: `allow` (tagged match), `quiz_gate`, `unknown` → consumer profile treats unknown as allow + enqueue for background classification (fail-open); profile flag `consumer|institutional` read from config — institutional path may be stubbed but the branch must exist.
R3. Content script extracts page metadata only (NOT full DOM text) and messages the worker via the typed schema; classification result cached per-origin in storage with TTL 24h.
R4. Gate-list v1 is a static curated list (~50 domains: video, gaming, social) shipped with the extension; editable per-family in later spec 007 settings.
R5. Main-thread cost of the content-script extraction < 4ms measured; worker classification uses ensureCore() warm path.
R6. Zero network calls in this spec — background classification queue is a local stub writing to storage (real backend is Phase 2+).
R7. Every code path that would ever send data out routes through sanitize() — enforced now even though no network exists (choke-point discipline).

## Out of scope
- The quiz gate page itself (spec 005) — this spec only routes to it
- Institutional interstitial UX; remote classification backend; full-DOM analysis

## Acceptance criteria (how "done" is proven)
- [ ] Test: pipeline unit tests for all four stages × in/out of study hours; TTL cache behavior
- [ ] Evidence: screen recording — Khan Academy loads clean, youtube.com routes to gate placeholder, unknown blog loads (fail-open) and appears in the local classification queue
- [ ] Benchmark: content-script extraction < 4ms p95 on the reference Chromebook; end-to-end verdict latency logged
- [ ] Grep evidence: no `fetch(` outside the sanitize-guarded proxy module

## Open questions (must be empty before Status: Approved)
- Q1: Study-hours granularity v1 — one daily window, or per-weekday schedule?
- Q2: Should allow-verdict pages show any subtle indicator (green underline in toolbar icon) or stay invisible?
