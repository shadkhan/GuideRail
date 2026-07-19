# 0003. Classify in Rust-WASM with Aho-Corasick, scrub PII at one regex-lite choke point

Date: 2026-07-18 | Status: Accepted | Supersedes: — | Superseded by: —

<!-- Acronyms (first use): WASM = WebAssembly; PII = Personally Identifiable
     Information; MV3 = Manifest V3; ADR = Architecture Decision Record;
     SW = service worker; NER = Named-Entity Recognition. -->

## Context

Every GuideRail feature sits on one unproven claim: that curriculum keyword
matching and PII scrubbing can run locally, in Rust compiled to WASM, inside a
real MV3 service worker, fast enough to stay off the critical path. The
performance budget (CLAUDE.md) is main-thread work < 16.6 ms per operation; the
spec-001 acceptance gates sharpen that to warm-path classify p95 < 5 ms,
cold-start < 50 ms, and a gzipped `.wasm` < 200 KB on modest hardware. This is
also the privacy architecture: because classification never leaves the device,
"we never receive children's data" is structural, not a policy promise (L-005).
The decision to settle here is *how* to build that core — matcher algorithm,
PII engine, and the boundary shape — before four downstream specs depend on it.

## Decision

We will implement the classifier core in **pure Rust** with a thin
`wasm-bindgen` boundary confined to `lib.rs`, exposing exactly two functions:
`classify(text, pack_id) -> {verdict, matches}` and `sanitize(text) -> String`.
Keyword matching uses the **`aho-corasick`** crate — one automaton walk,
O(text + matches) regardless of pattern count — never regex for keyword sets.
PII scrubbing uses **`regex-lite`** (not the full `regex` crate) with
`lazy_static`-compiled patterns applied longest-match-first, tokenising emails,
phones (India/US/UK), coordinates, and a curated seed name-list to `[EMAIL]`,
`[PHONE]`, `[COORD]`, `[NAME]`. `sanitize()` is the single network-egress choke
point. The release build is size-optimised (`opt-level="s"`, `lto`,
`codegen-units=1`, `panic="abort"`) and post-processed with `wasm-opt -Os`.

Measured on a 2013 Intel i7-4800MQ (Haswell) in a real Chrome service worker
via the Puppeteer harness (`bench/results/history.csv`):

| Metric | Result | Budget |
|---|---|---|
| warm-path classify p95 | **0.1 ms** (p99 0.2 ms) | < 5 ms |
| cold-start p50 (code-cached SW wake) | **42.8 ms** | < 50 ms |
| gzipped `.wasm` | **86.5 KB** (214 KB raw) | < 200 KB |

## Alternatives considered

| Option | Why rejected (one honest sentence) |
|---|---|
| Regex / RegexSet for keyword matching | O(keywords × text) or a huge automaton; aho-corasick is the purpose-built one-pass tool for large keyword sets (L-004). |
| Full `regex` crate for PII | Its Unicode tables + DFA added ~250 KB gzipped — the `.wasm` measured 337 KB, over budget; regex-lite covers every pattern we use and lands at 86.5 KB. |
| Classifier in TypeScript/JS | Loses the "Rust where the sub-16 ms budget is load-bearing" narrative and the portfolio evidence; JS keyword matching at this scale is slower and less predictable. |
| Cloud lookup / server classification | Sends child browsing data off-device — breaks the privacy architecture (L-005) and adds per-request latency and cost. |
| wasm-bindgen types throughout the core | Couples business logic to the WASM runtime and blocks plain `cargo test`; confining bindgen to `lib.rs` keeps the core host-testable. |

## Consequences

- **Positive:** The load-bearing perf claim is proven with real-browser numbers,
  not Node (which flatters WASM ~30%). Warm-path classify is ~50× under its
  budget, so classification is effectively free during active browsing. The
  pure-Rust core is unit-tested by `cargo test` (13 tests, ≥30-case PII corpus)
  with no runtime. One `sanitize()` choke point makes the privacy guarantee
  greppable by the review agent.
- **Negative / accepted debt:**
  - **Name detection is a curated seed list.** Names not on the list pass
    through unscrubbed — a real false-negative surface. A larger list plus
    on-device NER is the eventual fix; out of scope for the spike.
  - **Cold-start is close to its budget on old hardware.** 42.8 ms p50 on a
    2013 CPU leaves little headroom, and samples ranged 38–64 ms; the
    first-ever install (uncached compile) is ~110 ms. Warm-path dominates real
    sessions, but cold-start is the metric to watch.
  - **`wasm-opt` runs via the npm `binaryen` package, not wasm-pack.** wasm-pack
    fetches binaryen from GitHub at build time, which this build network blocks;
    we disabled that (`wasm-opt = false` in Cargo metadata) and apply
    `wasm-opt -Os` from the npm binary in the harness instead.
  - **Benchmarked in a web service worker, not an MV3 extension worker.** Current
    stable Chrome (2026) blocks the `--load-extension` command-line switch, so
    Puppeteer cannot load an unpacked extension. The fixture SW uses zero
    `chrome.*` APIs, so the WASM execution path (V8 engine, worker scheduling,
    fetch-then-instantiate cold start) is identical; the MV3 messaging layer sits
    outside the perf-critical path.
  - **New core-wasm dependencies:** `aho-corasick`, `regex-lite`, `lazy_static`,
    `thiserror` — each recorded here per the "dependency added to core-wasm →
    ADR" rule.
- **Revisit when:** cold-start p50 on real Chromebook-class hardware exceeds
  50 ms; OR the name false-negative rate becomes a demonstrated privacy gap; OR
  a pack's keyword set grows large enough to move the warm-path p95 toward 5 ms;
  OR a Chrome/loading route lets us re-run the benchmark in an actual MV3
  extension service worker.

## Interview note

The spike's job was to de-risk the whole architecture with one number:
sub-millisecond classification in a real browser worker (0.1 ms p95 on a
2013 laptop). That single measurement justifies three coupled bets at once —
Rust only where a 16.6 ms frame budget is load-bearing, privacy by keeping
classification on-device, and a freemium cost structure with no per-classify
server spend. The honest caveats I'd lead with: name scrubbing is a seed list
today (a known false-negative surface), and cold-start has thin headroom on
old hardware — so warm-path is the win, cold-start is the watch-item.
