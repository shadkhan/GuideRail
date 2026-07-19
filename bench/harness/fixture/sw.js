// Bench fixture service worker. Loaded ONLY by bench/harness/puppeteer.mjs.
// It imports the wasm-pack `--target web` module, instantiates the WASM once
// at worker start, and exposes timing helpers on `self.__bench` that the
// harness drives via worker.evaluate().
//
// Substrate note: this runs as a plain *module ServiceWorker* registered
// from index.html over a local static server, NOT as an MV3 (Manifest V3)
// extension service worker. Current stable Chrome (2026) blocks the
// --load-extension command-line switch, so puppeteer can't load an unpacked
// extension. The distinction is immaterial to what spec 001 measures: this
// file uses ZERO chrome.* APIs — it is pure WASM + performance timing — so
// the classify() execution path (V8 WASM engine, worker-thread scheduling,
// fetch-then-instantiate cold start) is identical to an extension SW. The
// MV3 chrome.runtime messaging layer sits outside the perf-critical path.
// See ADR-0003 and the harness header. manifest.json is retained for the
// (currently unloadable) extension path and a future re-run on that route.
//
// Why here and not packages/extension? Spec 001 must prove the WASM runs in
// a real service worker BEFORE the spec-002 extension build pipeline exists.
//
// Cold vs warm timing (per spec 001):
//   COLD: worker spawn -> WASM instantiate -> first classify(). The wasm
//     bytes come from the packaged extension file on local disk — the
//     equivalent of the production chrome.storage.local cached-bytes path
//     (no network either way). Measured with the worker's own clock so we
//     capture time the harness spent before it could attach.
//   WARM: subsequent classify() calls with the module already live.

import init, { classify, sanitize } from "./pkg/guiderail_core.js";

// Activate immediately so each fresh registration (cold sampling) becomes the
// active worker without waiting on the previous one to release the page.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// performance.now() is ~0 at worker start, so this is "ms since spawn".
let coldReadyMs = null;
const ready = init().then(() => {
  coldReadyMs = performance.now();
  return true;
});

self.__bench = {
  // Resolves once WASM is instantiated. Lets the harness gate on readiness.
  async ready() {
    await ready;
    return true;
  },

  // COLD metrics, measured inside the worker: time to instantiate WASM
  // (coldReadyMs) plus the first classify() call after that.
  async cold(text, packId) {
    await ready;
    const t0 = performance.now();
    classify(text, packId);
    const firstClassifyMs = performance.now() - t0;
    return {
      coldReadyMs,
      firstClassifyMs,
      totalMs: coldReadyMs + firstClassifyMs,
    };
  },

  // WARM path: run `n` classify() calls, return per-call durations (ms).
  // One boundary crossing per call on purpose — that is what production
  // does (one classify per page), so per-call latency is the honest metric.
  async warm(n, text, packId) {
    await ready;
    const times = new Array(n);
    for (let i = 0; i < n; i++) {
      const s = performance.now();
      classify(text, packId);
      times[i] = performance.now() - s;
    }
    return times;
  },

  // Sanity check that sanitize() is callable across the boundary too.
  async sanitizeOnce(text) {
    await ready;
    return sanitize(text);
  },
};
