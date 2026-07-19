// WASM core lifecycle manager (spec 002 R5).
//
// This is the seam between the ephemeral MV3 (Manifest V3) service worker and
// the spec-001 Rust-WASM classifier. Two facts drive the design:
//
//   1. The worker dies after ~30s idle and its module scope evaporates, so the
//      WASM instance cannot be a durable singleton — it is re-instantiated on
//      each cold wake. What IS durable is the compiled module's BYTES, which we
//      cache in chrome.storage.local on install so a wake never re-reads disk
//      via the network stack.
//   2. wasm-pack's `--target web` init accepts explicit bytes — `init(bytes)` —
//      so we instantiate straight from the cached buffer with no fetch on the
//      hot path.
//
// ensureCore() instantiates the WASM module and hands back the stateless
// entry points (currently sanitize()): warm calls get the already-instantiated
// instance from module scope; the first (cold) call instantiates from cached
// bytes and emits a `[gr-bench]` timing mark the benchmark harness parses.
//
// Classification is no longer here: as of spec 003 packs are DATA, so the
// classifier is BUILT from a pack's keywords and held per worker life by
// pack/loader.ts (ensureClassifier). That module imports the WASM-bound
// GuideClassifier class and awaits ensureCore() before constructing it.

import initWasm, { sanitize as wasmSanitize } from "../../core-wasm/pkg/guiderail_core.js";
import * as storage from "./storage.js";

/** Packaged WASM binary, relative to the extension root (web_accessible). */
const WASM_RESOURCE = "pkg/guiderail_core_bg.wasm";

export type Verdict = "allow" | "quiz_gate" | "unknown";
export interface ClassifyResult {
  verdict: Verdict;
  matches: string[];
}

export interface CoreApi {
  sanitize(text: string): string;
}

// Module-scope cache: a promise so concurrent first-callers share one
// instantiation instead of racing. Null again only when the worker is killed.
let corePromise: Promise<CoreApi> | null = null;

// --- base64 <-> bytes (chunked; ~214KB would overflow String.fromCharCode
//     with a single spread) --------------------------------------------------
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function fetchPackagedBytes(): Promise<Uint8Array> {
  const url = chrome.runtime.getURL(WASM_RESOURCE);
  const buf = await (await fetch(url)).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Cache the compiled WASM bytes into chrome.storage.local. Called from the
 * worker's onInstalled (spec 002 R5) so later cold wakes instantiate from the
 * store rather than re-reading the packaged resource.
 */
export async function cacheWasmBytes(): Promise<void> {
  const bytes = await fetchPackagedBytes();
  await storage.set("wasm.bytes", bytesToBase64(bytes));
}

async function loadBytes(): Promise<Uint8Array> {
  const cached = await storage.get("wasm.bytes");
  if (cached) return base64ToBytes(cached);
  // Cache miss (e.g. onInstalled hasn't run yet): fall back to the packaged
  // resource so classify never hard-fails on a fresh profile.
  return fetchPackagedBytes();
}

/**
 * Return the WASM core, instantiating it on the first (cold) call and reusing
 * it on every warm call within the worker's life. Every WASM entry point —
 * sanitize() here, and the GuideClassifier built by pack/loader.ts — goes
 * through here first; there is no other instantiation path.
 */
export function ensureCore(): Promise<CoreApi> {
  if (corePromise) return corePromise;

  corePromise = (async () => {
    const t0 = performance.now();
    const bytes = await loadBytes();
    // Object form: passing InitInput positionally is deprecated in
    // wasm-bindgen 0.2.126. `bytes` is a BufferSource → WebAssembly.instantiate
    // runs directly, no fetch.
    await initWasm({ module_or_path: bytes });
    const coldMs = performance.now() - t0;

    // Timing mark consumed by bench/harness (spec 001 format).
    console.log(`[gr-bench] core-init cold=${coldMs.toFixed(2)}ms bytes=${bytes.byteLength}`);
    try {
      await storage.set("core.timing", {
        cold_ms: Number(coldMs.toFixed(2)),
        at: new Date().toISOString(),
      });
    } catch {
      // Diagnostics only — never let a storage hiccup break classification.
    }

    return {
      sanitize: (text: string) => wasmSanitize(text),
    } satisfies CoreApi;
  })();

  return corePromise;
}

/** Test/diagnostic hook: drop the cached instance so the next ensureCore() is cold. */
export function __resetCoreForTest(): void {
  corePromise = null;
}
