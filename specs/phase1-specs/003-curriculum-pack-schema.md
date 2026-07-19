# Spec: Curriculum Pack Schema & Loader
Status: Implemented · Date: 2026-07-17 (implemented 2026-07-19) · ADRs: ADR-0004 (pack format & trust model) — Accepted

## Goal (one sentence, user-visible outcome)
A parent picks "Class 7 · CBSE" (or "General Homeschool") once, and the extension knows what schoolwork means for that child — packs are content drops, never code releases.

## Requirements (numbered, testable)
R1. Pack = single JSON file, board-agnostic schema: `{id, version, locale, board, grade_band, tags[], allow_domains[], allow_keywords[], quiz_topics[], updated_at}` — schema documented in `docs/pack-schema.md` with a JSON Schema file for validation.
R2. Keywords compile into the Aho-Corasick automaton at pack load; automaton cached in memory per worker life, rebuilt on pack change (rebuild time logged; budget < 100ms for a 10k-keyword pack).
R3. Loader validates against JSON Schema + size cap (≤ 2MB) before activation; invalid pack → keep previous pack, surface error state (never brick filtering).
R4. Packs stored versioned in `chrome.storage.local` (`gr.v1.pack.<id>`); atomic swap on update.
R5. Three seed packs shipped in-extension: `cbse-class7`, `icse-class7`, `homeschool-general` (small but real: ≥300 keywords, ≥50 domains each).
R6. Pack selection API used by onboarding (spec 007): list available, get active per profile, set active.
R7. Update mechanism v1: bundled packs only (no network fetch). Signed remote pack delivery is explicitly deferred — leave a `signature` field reserved in the schema.

## Out of scope
- Remote pack CDN, signing/verification implementation (Phase 3; reserve fields only)
- Pack authoring UI; multi-language keyword variants (Hinglish arrives Phase 3)

## Acceptance criteria (how "done" is proven)
- [x] Test: schema validation suite (valid, oversized, malformed, wrong-version cases); atomic-swap test proves old pack survives failed update — `packages/extension/src/pack/validate.test.ts` (21 cases, ajv cross-check) + `loader.test.ts` (atomic-swap-survives-failed-update)
- [x] Benchmark: automaton rebuild < 100ms for 10k keywords (harness run, number in evidence) — `packages/extension/src/pack/build-budget.test.ts`, committed & run by `pnpm test`: 10k build = **83ms** (curve: 1k≈10ms, 5k≈44ms), seed packs (305 kw) build in single-digit ms
- [x] Evidence: three seed packs pass validation; classify() returns correct tags for 24 hand-picked texts per pack (incl. false-positive guards) — `packages/extension/src/pack/seeds.test.ts`
- [x] ADR-0004 written (why JSON+JSON-Schema, why bundled-first, trust model reserved fields) — `docs/adr/0004-pack-format-and-trust.md`

## Resolved decisions (were open questions; resolved with user 2026-07-19)
- Q1 (seed keyword source): **curate with Claude now**, seeded from the 003A verified domain/channel base; human review before packs are marked final. Deriving from NCERT PDFs deferred (would block on the VidyaOS files).
- Q2 (grade_band granularity): **per-class** — `grade_band` holds a single class, e.g. `"7"`. Seed ids `cbse-class7` / `icse-class7` reflect this.

## Post-implementation notes
- R6 "get active per profile": Phase 1 has a single global `active.pack` pointer; multi-child *profiles* are spec 011. The API shape (list/get-active/set-active) is in place; per-profile activation layers on when 011 lands.
- Verdict model is allow-only here (Allow/Unknown from the pack); the distraction→QuizGate list is a small built-in in core-wasm for continuity. Fail-open/closed verdict policy is spec 004.
- Curation guard (spec-reviewer finding): seed keywords avoid bare short common words (substring matcher would collide, e.g. `exam`⊂`example`); false-positive guards in seeds.test lock this in. See ADR-0004.
