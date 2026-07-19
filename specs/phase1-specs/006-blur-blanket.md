# Spec: Blur Blanket — default-hidden media safety
Status: Draft · Date: 2026-07-17 · ADRs: implements the L-002 inversion (blur by default, unblur on validation)

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
- [ ] Test: activation logic unit tests (hours × origin-trust matrix); chunking respects budget with 500 synthetic imgs
- [ ] Evidence: WebPageTest/DevTools filmstrip on a mixed-content page proving zero unblurred first paint on an untrusted origin
- [ ] Evidence: trusted origin (Khan Academy) shows NO blur at any point in the filmstrip
- [ ] Performance trace: longest main-thread task from this feature < 16.6ms on the reference Chromebook

## Open questions (must be empty before Status: Approved)
- Q1: Blur strength/brightness values — confirm visually with your own kids as testers (the credited red team)?
- Q2: Should background-image CSS content be in scope for v1, or explicitly deferred (recommend defer, note in ADR)?
