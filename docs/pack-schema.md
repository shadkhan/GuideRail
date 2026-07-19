# Curriculum Pack Schema

A **pack** is a single JSON file that tells GuideRail what "schoolwork" means for
one child. Packs are **data, not code** — a content drop, never a code release.
This document is the human-readable companion to the machine contract in
`packages/extension/src/pack/schema.json` (JSON Schema draft-07). When the two
disagree, the JSON Schema wins; the runtime validator in
`packages/extension/src/pack/validate.ts` mirrors it, and `pack/validate.test.ts`
proves they agree. See ADR-0004 for why the format is what it is.

## Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Stable identifier, `^[a-z0-9][a-z0-9-]{1,62}$`, e.g. `cbse-class7`. |
| `version` | string | yes | Pack content version, semver `^\d+\.\d+\.\d+$`. |
| `locale` | string | yes | BCP-47, e.g. `en-IN`. |
| `board` | string | yes | e.g. `CBSE`, `ICSE`, `General`. |
| `grade_band` | string | yes | **Per-class** (spec Q2), e.g. `"7"` — not a range. |
| `tags` | string[] | yes | Subject vocabulary. Every keyword `tag` and channel `subject` draws from here. |
| `allow_domains` | string[] | yes | Bare host strings, no scheme/path, e.g. `khanacademy.org`. |
| `allow_keywords` | `{term,tag}[]` | yes | Curriculum keywords compiled into the Aho-Corasick automaton at load. `term` is matched in page text (ASCII case-insensitive, **substring** match); `tag` is the subject label returned. |
| `allow_yt_channels` | `YtChannel[]` | yes | Channel-level YouTube allowlist (003A). |
| `quiz_topics` | string[] | yes | Topics the quiz engine (specs 005/012) may quiz on. **Not** distraction keywords. |
| `updated_at` | string | yes | ISO-8601 timestamp. |
| `yt_policy` | `YtPolicy` | no | YouTube policy overrides; defaults applied when absent (003A A2). |
| `signature` | string | no | **Reserved** for Phase 3 signed delivery. Present ⇒ ignored (never verified in Phase 1). |

### YtChannel (003A A1)
| Field | Type | Notes |
|---|---|---|
| `channel_id` | string | **Authoritative** match key, `^UC[A-Za-z0-9_-]{22}$`. Matched by exact string compare — never the automaton (003A A6). Must be unique within a pack. |
| `handle` | string | Parent-facing display, e.g. `@KhanAcademyIndia`. |
| `label` | string | Parent-facing name. |
| `subjects` | string[] | Subjects the channel covers; drawn from the pack's `tags`. |

### YtPolicy (003A A2, reserved semantics)
| Field | Values | Default |
|---|---|---|
| `shorts` | `gate` \| `allow` \| `inherit` | `gate` |
| `embeds` | `inherit_parent` | `inherit_parent` |

## Rules the JSON Schema cannot express (validator-only)
- **Size cap:** a serialized pack must be ≤ 2 MB (spec 003 R3).
- **Channel uniqueness:** no two channels may share a `channel_id` (003A A8).

These live only in `validate.ts` and are tested directly, since draft-07 cannot
express a byte-size limit or per-key uniqueness.

## Curation rule (003A)
**YouTube channels are curated by human review, never auto-added.** Each
`channel_id` must be a real, verified `UC…` id resolved against live YouTube
before a pack ships as final. Seed packs currently carry **visible placeholder**
channel_ids (format-valid but obviously fake) — the acceptance criterion "≥5
verified channels with correct channel_ids" stays unchecked until a human
curation pass replaces them. See `packages/extension/src/pack/seeds/index.ts`.

## Verdict model
Packs are an **allow model**: a curriculum keyword match → `allow`; no match →
`unknown`. The distraction → `quiz_gate` side is a small built-in list in the
Rust core (continuity with spec 001), not a pack field — the real fail-open /
fail-closed verdict policy is spec 004 (filtering engine). `quiz_topics` is for
quiz generation, not distraction detection.

## Storage & lifecycle
- Packs are stored versioned under `gr.v1.pack.<id>`; the active pack is pointed
  to by `gr.v1.active.pack` (spec 003 R4).
- Installation validates first; an invalid pack is rejected without touching
  storage, so the previously active pack survives (R3). Activation is a single
  atomic `chrome.storage.local.set` of the pack bytes + the active pointer.
- The classifier is built from the active pack's `allow_keywords` once per
  service-worker life and cached; it rebuilds only on pack change (R2). Rebuild
  time is logged as a `[gr-bench] pack-build …` mark.
