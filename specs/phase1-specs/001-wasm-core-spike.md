# Spec: WASM Core Spike — matcher, sanitizer, benchmark harness
Status: Implemented · Date: 2026-07-17 (implemented 2026-07-18) · ADRs: ADR-0003 (classification architecture) — Accepted

## Goal (one sentence, user-visible outcome)
Prove the performance claims underneath every other feature: curriculum keyword matching and PII scrubbing run in Rust-WASM inside a real MV3 service worker within budget on Chromebook-class hardware.

## Requirements (numbered, testable)
R1. `packages/core-wasm` Rust crate exposing exactly two boundary functions via wasm-bindgen: `classify(text, pack_id) -> ClassifyResult` and `sanitize(text) -> String`.
R2. `classify` uses the `aho-corasick` crate against a loaded pack's keyword set; returns matched tags + verdict (allow | quiz_gate | unknown). No regex for keyword sets.
R3. `sanitize` scrubs emails, phone formats (IN + US + UK), lat/long coordinates, and listed names via pre-compiled patterns, longest-match first; returns tokenized text (`[EMAIL]`, `[PHONE]`, …).
R4. Pure-Rust core testable with plain `cargo test`; wasm-bindgen confined to a thin `lib.rs` boundary layer; no `unwrap()` in that layer — all boundary fns return Result.
R5. Benchmark harness (`pnpm bench:wasm`): Puppeteer launches real Chrome with the unpacked extension, drives N=1,000 classify calls inside the service worker, reports p50/p95/p99 warm-path and separate cold-start (fresh worker → cached bytes → instantiate → first call).
R6. Results appended to `bench/results/history.csv`; `baseline.json` written only on explicit approval (hook enforces this).
R7. Release profile: `opt-level="s"`, `lto=true`, `codegen-units=1`, `panic="abort"`.

## Out of scope (explicit — the reviewer checks this)
- Any DNR rules, quiz UI, blur logic, or network calls
- Pack signing/distribution (spec 003) — this spike uses one hardcoded test pack
- Name-detection beyond the curated-list + heuristic approach (accept the known weakness; note in ADR)

## Acceptance criteria (how "done" is proven)
- [x] Test: `cargo test` green (13 tests); sanitize corpus = 30 PII cases incl. Hinglish-adjacent phone/name formats
- [x] Benchmark: warm-path p95 **0.1 ms** (< 5 ms), cold-start p50 **42.8 ms** (< 50 ms), measured in real Chrome via the harness
- [x] Size: `.wasm` gzipped **86.5 KB** (< 200 KB), after `regex-lite` swap + `wasm-opt -Os`
- [x] Evidence artifact: bench/results/history.csv row (i7-4800MQ); ADR-0003 written via adr-writer skill

## Deviations from spec (accepted — see ADR-0003)
- **R5 substrate:** measured in a real Chrome *module ServiceWorker* (localhost), not an MV3 *extension* SW — current stable Chrome blocks CLI `--load-extension` (L-008). Fixture uses zero `chrome.*`, so the WASM path is engine-identical. Re-run on an extension SW is a follow-up.
- **Dependencies:** `regex-lite` replaced the full `regex` crate to meet the size budget; `wasm-opt` runs via the npm `binaryen` package (wasm-pack's GitHub download is blocked here).

## Open questions (resolved)
- Q1 → **Resolved:** shipped a small curated seed name-list (`SEED_NAMES` in sanitize.rs); unlisted names are a documented false-negative (ADR-0003).
- Q2 → **Resolved:** published numbers measured on this dev machine (Intel i7-4800MQ, 2013 Haswell); the Chromebook-class claim stays provisional until re-run on a real low-spec device.
