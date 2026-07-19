# bench/ — Puppeteer harness (real Chrome, not Node)

Per the wasm-build skill: **Node inflates WASM performance ~30%.** All benchmarks
run against real Chrome via Puppeteer, driving the service worker in the actual
MV3 runtime.

## Layout

```
bench/
  README.md            ← this file
  harness/
    puppeteer.mjs      ← the runner (spec 001 impl)
  results/
    history.csv        ← every run appends one row (append-only)
    baseline.json      ← current baseline; writes blocked by hook, requires approval
```

## Commands

- `pnpm bench:wasm` — one benchmark run: build WASM (`wasm-pack build --release`),
  launch Chrome via puppeteer, load unpacked extension, cold-start + 1000 warm
  classifies, append row to `results/history.csv`.

## Budgets (per spec 001)

| Path | Metric | Budget |
|---|---|---|
| Warm  | p95 classify | < 5 ms |
| Cold  | first classify after worker wake | < 50 ms |
| Size  | gzipped .wasm | < 200 KB |

## Baseline discipline

`results/baseline.json` is the reference for regression tolerance (±10%).
The PreToolUse hook in `.claude/settings.json` blocks writes to this file
unless the user explicitly approves — bench numbers can't be silently rebased.

Updating the baseline is a deliberate act: run bench, inspect the delta vs.
current baseline, then approve the write.
