# Spec 003 — Amendment A: YouTube channels & verified India platform list
Status: Implemented (schema · validation · loader) — channel_id verification (A5) OUTSTANDING · Date: 2026-07-18 (implemented 2026-07-19) · Applies to: specs/phase1-specs/003-curriculum-pack-schema.md · ADRs: pack portion of ADR-0010 (YouTube policy)

## Why (context for the implementing session)
Field research (July 2026): the platforms Indian students actually study on are Khan Academy, Physics Wallah (pw.live), DIKSHA (materially improved; supersedes ePathshala), Vedantu, Unacademy, Doubtnut, Toppr, CK-12, and the NCERT-solutions ecosystem — and, dominantly, YouTube channel ecosystems (Physics Wallah, Magnet Brains, Khan Academy India, LearnoHub). YouTube is simultaneously the #1 study venue and the #1 gate-list target; domain-level verdicts cannot express this. Packs must speak channel-level YouTube.

## Schema changes (amend R1)
A1. Add `allow_yt_channels[]`: array of `{channel_id, handle, label, subjects[]}` — channel_id (UC…) is authoritative for matching; handle (@name) and label are for parent-facing display; subjects[] reuses the pack tag vocabulary.
A2. Add optional `yt_policy` object: `{shorts: "gate"|"allow"|"inherit", embeds: "inherit_parent"}` with defaults `shorts: "gate"`, `embeds: "inherit_parent"` (see 004 Amendment for semantics). Reserved now so packs can override later without schema churn.
A3. ePathshala removed from all seed guidance; DIKSHA (diksha.gov.in) included.

## Seed pack allowlist baseline (amend R5)
A4. All three seed packs seed `allow_domains` from this verified base (pack curator prunes per class/subject):
khanacademy.org · pw.live · diksha.gov.in · ncert.nic.in (textbook PDFs) · vedantu.com · unacademy.com · doubtnut.com · toppr.com · ck12.org · tiwariacademy.com · learncbse.in · mycbseguide.com · selfstudys.com
A5. Seed `allow_yt_channels` (curation session to verify current channel_ids before ship): Khan Academy India · Magnet Brains · LearnoHub · Physics Wallah board-level channels appropriate to the pack's class. Minimum 5 channels per seed pack.

## Constraints & interactions with implemented 001
A6. Channel matching uses exact-string compare on channel_id — NOT the Aho-Corasick automaton and NOT regex-lite patterns; keep it a plain set lookup in the pack loader (TS side). No core-wasm change required by this amendment.
A7. Automaton rebuild budget (<100ms/10k keywords) unchanged; allow_yt_channels adds zero automaton cost. Pack size cap (2MB) unchanged — channel list is trivially small.
A8. Pack JSON Schema + validation suite extended: channel_id format check (^UC[A-Za-z0-9_-]{22}$), duplicate-channel rejection, yt_policy enum validation.

## Acceptance criteria additions
- [x] Schema tests: valid/invalid channel_id cases, yt_policy defaults applied when absent — `packages/extension/src/pack/validate.test.ts` (channel_id regex, duplicate rejection, yt_policy defaults/enums)
- [ ] Each seed pack ships ≥5 verified channels with correct channel_ids (evidence: resolution check output per channel) — **NOT MET.** Each seed ships 5 channels (KA India, Magnet Brains, LearnoHub, Physics Wallah umbrella, NCERT Official) but channel_ids are **visible placeholders** (format-valid `^UC…{22}$`, obviously fake), NOT resolved against live YouTube. Tracked in `packages/extension/src/pack/seeds/index.ts` and ADR-0004. Requires a human curation pass (web resolution or user-supplied ids) before this box is checked.
- [x] docs/pack-schema.md updated with the new fields + the curation rule: channels are curated by human review, never auto-added — `docs/pack-schema.md`

## Resolved decisions (were open questions; resolved with user 2026-07-19)
- AQ1: **single Physics Wallah umbrella entry** with `subjects[]` filtering (not per-class). Simpler to curate for beta; accepts that some off-class PW content is allowlisted.
- AQ2: parent-facing channel management stays **pack-only for beta**; add/remove-per-family is deferred to the Phase 2 dashboard (demand noted).
