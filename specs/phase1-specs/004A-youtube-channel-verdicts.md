# Spec 004 — Amendment A: YouTube channel-aware verdicts
Status: Implemented (allowlist inert until 003A channel_ids are verified) · Date: 2026-07-18 (implemented 2026-07-20) · Applies to: specs/phase1-specs/004-filtering-engine.md · ADRs: produces ADR-0010 (YouTube policy: the classroom-playground problem) — Accepted

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
- [x] Test matrix: allowed-channel watch (allow + tags) · non-allowed watch (gate) · shorts (gate) · search/homepage (allow_navigation, no history) · embed (inherit) · SPA hop re-trigger · resolution failure (gate + logged) — `packages/extension/src/pipeline/youtube.test.ts`, `policy.test.ts`, `service_worker.test.ts`
- [~] Evidence recording: Magnet Brains lecture plays untouched; sidebar music video gates without reload. **Manual step** (L-008 blocks CLI extension loading) — the behavior is unit + integration tested; the recording is produced by hand via `pnpm ext:dev`, and requires real channel_ids first (see status note).
- [x] Evidence: reading-history contains lecture subject tags and NOT search/homepage visits — `policy.test.ts` (allow-channel records tags; allow_navigation records nothing)
- [x] ADR-0010 written (classroom-playground, format-level Shorts, fail-closed-on-YouTube reconciled with ADR-0001, SPA/DNR limitation) — `docs/adr/0010-youtube-policy.md`
- [x] INTERVIEW_BANK: IQ entry "How do you filter YouTube without blocking the classroom?" — `docs/INTERVIEW_BANK.md` IQ-015

## Resolved decisions (were open questions; resolved with user 2026-07-19)
- AQ1: **full weight** — an allowed-channel view records its subject tags to reading-history at the same weight as read text (video IS studying in India).
- AQ2: **origin-wide earned-time EXCEPT Shorts** — earned time (spec 005) will open watch/nav origin-wide, but Shorts stay gated by format regardless (implemented as a format-level verdict that runs independent of any earned-time token; ADR-0010).

## Post-implementation notes
- A3 resolution-failure logging is **persisted** (`storage["yt.resolutionFailures"]`, `pipeline/yt-diagnostics.ts`), not just a console line, so a broken channelId selector is detectable after the fact.
- The allowlist is **inert until seed-pack channel_ids are verified** (carried over from 003A A5 — they are visible placeholders). Every `/watch` currently gates (fail-closed), which is safe but non-functional as an *allow* path until real `UC…` ids are curated.
