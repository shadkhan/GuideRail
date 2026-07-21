# Spec: Filtering Engine — classification flow & consumer profile policy
Status: Implemented · Date: 2026-07-17 (implemented 2026-07-20) · ADRs: implements ADR-0001 (fail-open/fail-closed as config); produces ADR-0010 (via 004A)

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
- [x] Test: pipeline unit tests for all four stages × in/out of study hours; TTL cache behavior — `packages/extension/src/pipeline/{policy,study-hours,verdict-cache,gate-list,youtube}.test.ts`
- [~] Evidence: screen recording — Khan Academy clean, youtube.com routes to gate, unknown blog fails open + enters the local queue. **Manual step** (Chrome 2026 blocks CLI extension loading, L-008); the behavior is proven by `service_worker.test.ts` page.eval integration tests (allow-domain, gate-list redirect, fail-open) — the visual recording is produced by hand via `pnpm ext:dev`.
- [x] Benchmark: content-script extraction < 4ms p95; end-to-end verdict latency logged — `src/pipeline/budget.test.ts` (evaluate p95 **0.011ms**), `[gr-bench] eval=…` / `extract=…` marks
- [x] Grep evidence: no `fetch(` outside the sanitize-guarded proxy module — the only `fetch(` is `core.ts` loading the local packaged WASM binary (no page/child data); the classify queue is local + sanitize()-scrubbed

## Resolved decisions (were open questions; resolved with user 2026-07-19)
- Q1 (study-hours granularity): **per-weekday schedule** — `config.studyHours` is `Partial<Record<Weekday, Window[]>>`; `chrome.alarms` fire on window boundaries and reconcile the gate-list DNR rules.
- Q2 (allow indicator): **invisible** — allowed pages get no badge/cue (matches the product's "invisible the rest of the time" promise).

## Post-implementation notes
- The pipeline is worker-side and pure (`policy.ts` `evaluate()`, deps injected); routing uses two mechanisms — DNR redirect for the static gate-list, `chrome.tabs.update` for non-declarative verdicts (metadata classify, YouTube channel, SPA hops).
- Institutional profile branch exists (fail-closed on unknown) but its interstitial UX is spec 004+ / out of scope; consumer is the default.
