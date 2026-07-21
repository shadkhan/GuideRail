# Spec: Blur Blanket — default-hidden media safety
Status: Implemented · Date: 2026-07-17 (implemented 2026-07-21) · ADRs: ADR-0011 (blur activation model) — Accepted; implements the L-002 inversion

## Goal (one sentence, user-visible outcome)
On unknown sites during study hours, images and video are blurred before they can ever paint, and quietly un-blur as they're validated — no explicit thumbnail ever flashes.

## Requirements (numbered, testable)
R1. Declarative CSS in manifest, `run_at: document_start`, matching `<all_urls>`: `img, video { filter: blur(30px) brightness(0.5) }` scoped under an activation class/attribute on `<html>` set synchronously by a document_start script IF (study hours AND origin not on allow fast-path).
R2. Trusted fast path: pack allow_domains and allow-verdict cached origins never activate the blur at all (same-frame check against a precomputed set injected into the content script's isolated world at document_start).
R3. Unblur validation v1 (local-only): per-image checks — same-origin or allowlisted CDN source, dimension heuristics (skip icons < 64px), origin verdict from spec 004 cache; passing elements get a per-element unblur class. No image-content ML in v1.
R4. Batch unblur via requestAnimationFrame — total main-thread cost < 16.6ms per frame regardless of image count (chunk the element list).
R5. MutationObserver used ONLY to apply per-element unblur to late-added nodes — never to apply blur (blur is declarative; the observer can only reveal, so a missed mutation fails safe).
R6. No layout thrash: unblur toggles a class only; no style reads in the loop (no getComputedStyle/offsetWidth in the hot path).
R7. Reduced-motion respected: transition on unblur disabled under prefers-reduced-motion.

## Out of scope
- Image-content classification (ML/NSFW models) — v1 is origin+heuristic trust only
- Video frame analysis; canvas/webgl content

## Acceptance criteria (how "done" is proven)
- [x] Test: activation logic unit tests (hours × origin-trust matrix); chunking respects budget with 500 synthetic imgs — `src/blur/activate.test.ts` (`shouldReveal` matrix + trusted-static drift guard), `src/blur/guard.test.ts` (`classifyMedia` + 500-item `runInChunks`); `reveal` round-trips in `service_worker.test.ts`
- [~] Evidence: DevTools filmstrip on a mixed-content page — zero unblurred first paint on an untrusted origin. **Manual** (L-008 blocks CLI extension loading); the activation + guard logic is unit-tested. Captured by hand via `pnpm ext:dev`.
- [~] Evidence: trusted origin (Khan Academy) shows NO blur at any point. **Manual** (L-008); `isTrustedStatic` covers the seed allow_domains synchronously so activation never fires there — verified in DevTools by hand.
- [~] Performance trace: longest main-thread task < 16.6ms. **Manual** (L-008); the guard is class-toggle-only, layout-read-free (R6), rAF-chunked (R4) — the chunking bound is unit-tested; the on-device trace is hand-captured.

## Resolved decisions (were open questions; resolved with user 2026-07-21)
- Q1 (blur strength): **keep default** `blur(30px) brightness(0.5)` — the v1 value; tune later with real testers.
- Q2 (background-images): **defer** — v1 is img/video only; CSS background-images and image-content ML are out of scope (ADR-0011).

## Post-implementation notes
- **Sync/async split (ADR-0011):** the document_start activation is trust-only via a bundled static set (the seed packs' allow_domains union, drift-guarded by a test), because study-hours/verdict-cache can't be read synchronously before paint (L-017). The full hours×trust decision arrives async via the worker's `reveal` flag (`shouldReveal`).
- **Residual:** a verdict-cache-allowed origin not in any pack's allow_domains flashes for one visit before the async reveal (documented, ADR-0011).
- R3's "origin verdict from spec 004 cache" is applied at the **whole-page** level (the `reveal` flag), not per-image; per-image trust is same-domain / CDN-allowlist / dimension.
