# 0004. Curriculum packs are bundled JSON, validated by a hand-written checker, with a reserved trust envelope
Date: 2026-07-19 | Status: Accepted | Supersedes: — | Superseded by: —

## Context
Spec 001 hardcoded one curriculum pack as a Rust compile-time constant; spec 003
makes packs DATA — a parent picks "Class 7 · CBSE" once and the extension loads a
JSON pack that defines what schoolwork means. Four forces shape the format and
trust model: (1) packs must ship offline in the extension for the private beta —
no CDN, no network fetch (R7); (2) a bad pack must never brick filtering — an
invalid update keeps the previous pack (R3); (3) keywords compile into the
Aho-Corasick automaton at load and rebuild only on pack change, under a 100ms /
10k-keyword budget (R2); and (4) the extension ships with ZERO runtime
dependencies and a hard 200KB gzipped WASM budget (ADR-0003), so validation
tooling cannot be free to add. Amendment 003A adds channel-level YouTube
allowlisting, which is matched by exact channel_id, not the automaton (A6).

## Decision
We will define a pack as a single JSON object with a fixed field set (spec 003 R1
+ 003A), documented by a draft-07 JSON Schema (`packages/extension/src/pack/schema.json`)
that is the contract of record. We will validate packs at runtime with a small
hand-written checker (`validate.ts`) — NOT a schema-validation library — to keep
the extension's runtime dependency count at zero; `ajv` is a devDependency only,
used in tests to prove the hand-written validator never under-rejects relative to
the schema. We will build the automaton in WASM from the pack's `allow_keywords`
via a new `GuideClassifier` object, built once per worker life and cached in
module scope, rebuilt on pack change. We will ship three seed packs bundled
in-extension (no network, R7) and store packs versioned under `gr.v1.pack.<id>`
with a separate `active.pack` pointer, activating a new pack in a single atomic
`chrome.storage.local.set`. We will reserve, but never act on, a `signature`
field (Phase 3 signed delivery) and a `yt_policy` object (spec 004 semantics).

## Alternatives considered
| Option | Why rejected (one honest sentence) |
|---|---|
| ajv (or zod) validating at runtime | Adds the extension's first runtime dependency and ~120KB, against the zero-dep / bundle-size discipline that ADR-0003 already paid to protect. |
| Keep the automaton a compile-time constant, ship packs as code | Every curriculum change becomes a code release + store review — packs must be content drops, not releases (the whole point of spec 003). |
| Rebuild the automaton per classify call | A 10k-keyword build is ~7–16ms; doing it on every page would blow the 16.6ms main-thread budget, whereas per-worker-life caching pays it once. |
| Parse the pack JSON inside WASM (serde_json) | serde_json's size cost pushes toward the 200KB WASM budget for no benefit; passing the already-parsed keyword array as a JsValue via serde-wasm-bindgen adds nothing to the binary. |
| Fold YouTube channels into the automaton | channel_id is an exact-match identity, not fuzzy text; a plain TS Set lookup is correct and keeps zero automaton cost (003A A6/A7). |

## Consequences
- Positive: packs are content, shippable and swappable without a code release; filtering never bricks (validation gates activation, atomic swap keeps the old pack); zero new runtime deps; WASM stays at 116KB gzipped, well under the 200KB budget; automaton rebuild measured at 5–16ms for 304 keywords (`[gr-bench] pack-build` marks), far under the 100ms/10k budget.
- Negative / accepted debt: the hand-written validator and `schema.json` are two encodings of one contract and can drift — mitigated but not eliminated by the ajv cross-check, which only covers schema-expressible rules (the size cap and per-key channel uniqueness are validator-only and separately tested). The `signature` field is present but unverified, so a bundled pack is trusted purely because it shipped inside the extension — acceptable while packs are bundled-only, a real gap the moment remote delivery lands. Seed-pack `channel_id`s are visible placeholders pending human verification (003A A5), so the YouTube allowlist is inert until curated.
- Revisit when: remote/signed pack delivery is implemented (Phase 3) — at that point `signature` must be verified before activation and this ADR is superseded by the trust-model ADR that defines the signing scheme; also revisit if a real pack approaches the 2MB cap or the automaton rebuild approaches 100ms.

## Interview note
Securly's scale question is "how do you update policy for millions of devices without shipping code to each one?" The answer here is the same shape as the privacy answer: classification data and classification logic are separated. Logic (the Aho-Corasick matcher, the PII scrubber) lives in a signed, reviewed WASM binary; policy (which keywords, which domains, which channels count as schoolwork) is data that flows separately and is validated at the client before it can take effect. Bundling first, with a reserved-but-unverified signature envelope, lets the beta ship offline today while making the eventual trust boundary explicit rather than retrofitted — the validator that keeps a malformed pack from bricking filtering is the same choke point that a signature check bolts onto later.
