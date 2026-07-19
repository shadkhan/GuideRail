// R2 budget evidence (committed, reproducible via `pnpm test`).
//
// Spec 003 R2: "automaton rebuild < 100ms for a 10k-keyword pack" — with the
// number "in evidence". This test builds the real WASM automaton from 1k/5k/10k
// synthetic keywords, logs each timing (visible in test output), and asserts the
// 10k build clears the 100ms budget. It doubles as a regression guard.
//
// Note (wasm-build skill): a Node context flatters wall-clock timings ~30% vs a
// real service worker, but this is a BUILD-path budget (off the 16.6ms hot
// path), and the seed packs a parent actually ships are ~305 keywords — those
// build in single-digit ms (see the [gr-bench] pack-build marks in seeds.test).
// The 10k case is the stress ceiling, not a realistic pack size.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it, expect, vi } from "vitest";
import { ensureCore } from "../core.js";
import { GuideClassifier } from "../../../core-wasm/pkg/guiderail_core.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(HERE, "..", "..", "..", "core-wasm", "pkg", "guiderail_core_bg.wasm");
const wasmBytes = new Uint8Array(readFileSync(WASM_PATH));

beforeAll(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(wasmBytes, { headers: { "Content-Type": "application/wasm" } })),
  );
  await ensureCore(); // instantiate WASM before building classifiers
});

function buildMs(n: number): number {
  const keywords = Array.from({ length: n }, (_, i) => ({
    term: `curriculumterm${i}`,
    tag: `tag${i % 8}`,
  }));
  const t0 = performance.now();
  const c = GuideClassifier.fromKeywords(keywords);
  const ms = performance.now() - t0;
  c.free();
  return ms;
}

describe("R2: automaton build budget", () => {
  it("builds a 10k-keyword automaton under the 100ms budget (curve logged)", () => {
    // Warm the JIT so the reported numbers are steady-state.
    buildMs(1000);
    const curve = [1000, 5000, 10000].map((n) => ({ n, ms: buildMs(n) }));
    for (const { n, ms } of curve) {
      console.log(`[gr-bench] pack-build stress n=${n} build=${ms.toFixed(2)}ms`);
    }
    const tenK = curve.find((c) => c.n === 10000)!;
    expect(tenK.ms).toBeLessThan(100);
  });
});
