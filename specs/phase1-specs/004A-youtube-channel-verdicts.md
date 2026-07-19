# Spec 004 — Amendment A: YouTube channel-aware verdicts
Status: Draft amendment · Date: 2026-07-18 · Applies to: specs/phase1-specs/004-filtering-engine.md · ADRs: produces ADR-0010 (YouTube policy: the classroom-playground problem)

## Why
YouTube is both the largest study venue in India and the primary distraction target. Domain-level verdicts fail in both directions. The pipeline gains one origin-specific resolution step: on YouTube, the verdict unit is the CHANNEL (and content format), not the domain.

## Pipeline changes (amend R1/R2)
A1. Insert step 2.5 (after allow_domains fast path, before gate-list check), active only when origin ∈ {youtube.com, m.youtube.com, youtube-nocookie.com}:
   - `/watch`: content script resolves channel_id from page metadata (meta itemprop="channelId", ytInitialData fallback; resolution is a DOM read within the existing extraction pass — no new injection). channel_id ∈ active pack's allow_yt_channels → verdict `allow` (tagged with the channel's subjects[]). Else → verdict `quiz_gate`.
   - `/shorts/*`: verdict per pack yt_policy.shorts (default `gate` — format-level decision regardless of channel; rationale in ADR-0010).
   - Homepage `/`, `/results` (search), channel pages: verdict `allow_navigation` — browsable, never counted as reading history, never feeds quiz topic-weighting (navigation is not studying).
   - Embedded players (youtube-nocookie.com or iframe on third-party page): `inherit_parent` — the embedding page's verdict governs; embed itself is never separately gated.
A2. SPA navigation: YouTube navigates client-side (yt-navigate-finish / URL change without reload). The content script MUST re-resolve on in-page navigation — a watch→watch hop to a non-allowed channel re-triggers the gate. DNR alone cannot see SPA hops; this check is script-side by necessity (note in ADR-0010).
A3. Resolution failure (metadata absent/changed by YouTube update): verdict falls back to `quiz_gate` for /watch during study hours — fail-closed on YouTube specifically, because unknown-YouTube is overwhelmingly entertainment; log resolution_failure locally for pack/selector maintenance.
A4. Earned-time tokens on YouTube apply origin-wide as today (spec 005 unchanged): earned time opens all of YouTube for the window — the deal stays simple and honest for the child.

## Budget & 001 interactions
A5. Channel resolution budget: ≤1ms added to the existing extraction pass (string compares + one set lookup; no wasm call needed). Warm-path headroom from 001 (0.1ms p95 classify) comfortably absorbs the metadata pass; total content-script budget stays <4ms p95 (R5 unchanged).
A6. No core-wasm changes. The classify() path is untouched; YouTube resolution is pure TS pipeline logic + pack set lookup.

## Acceptance criteria additions
- [ ] Test matrix: allowed-channel watch (allow + correct subject tags) · non-allowed watch (gate) · shorts (gate by default) · search/homepage (allow_navigation, no history entry) · embed on allowed study site (inherits allow) · SPA hop allowed→non-allowed (gate re-triggers) · metadata-resolution failure (gate + logged)
- [ ] Evidence recording: Magnet Brains lecture plays untouched during study hours; immediately clicking a music video from the sidebar triggers the quiz gate without page reload
- [ ] Evidence: reading-history buffer contains the lecture's subject tags and NOT the search/homepage visits
- [ ] ADR-0010 written: the classroom-playground problem, format-level Shorts decision, fail-closed-on-YouTube exception to the consumer fail-open default (explicitly reconciled with ADR-0001), SPA limitation of DNR
- [ ] INTERVIEW_BANK: add IQ entry — "How do you filter YouTube without blocking the classroom?" (this feature is a portfolio headline)

## Open questions (resolve in spec interview)
- AQ1: Should allowed-channel viewing during study hours accrue toward quiz topic-weighting at full weight, or reduced (video vs reading)? (Recommend full weight for beta; video IS studying in India.)
- AQ2: Earned-time on YouTube — origin-wide (A4, simple) vs still-gate-Shorts-during-earned-time (stricter)? Family-culture question; recommend origin-wide + revisit on beta feedback.
