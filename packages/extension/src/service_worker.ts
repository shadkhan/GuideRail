// GuideRail MV3 service worker.
//
// MV3 = Manifest V3, Chrome's current extension platform. The critical
// difference from MV2: there's no persistent background page. Instead there's a
// service worker that Chrome starts on demand and kills after ~30 seconds of
// idle time. Practical consequences:
//
//   1. NEVER store durable state in module-scope variables — it evaporates on
//      restart. Use chrome.storage (see storage.ts). The WASM instance is a
//      module-scope PERFORMANCE cache only, rebuilt on wake (see core.ts).
//   2. Register event listeners synchronously at the TOP LEVEL of this file.
//      Listeners registered inside async callbacks are lost when the worker
//      restarts — the runtime never re-runs the callback (Learning L-006).
//   3. Time-based logic must use chrome.alarms (persists across sleep), not
//      setTimeout (dies when the worker dies).
//
// PII = Personally Identifiable Information (scrubbed by core.sanitize()).

import { isClassifyRequest, type ClassifyResponse, type ErrorResponse } from "./messages.js";
import { cacheWasmBytes, ensureCore } from "./core.js";
import { runMigrations } from "./storage.js";
import { classify, installSeedPacks } from "./pack/loader.js";

// --- Top-level listeners (registered synchronously; L-006) ------------------

chrome.runtime.onInstalled.addListener((details) => {
  // Listener registration is synchronous; the work it kicks off is async. Every
  // step is idempotent, so re-running on update/reinstall is safe.
  void (async () => {
    await runMigrations();
    await cacheWasmBytes();
    // Install the three bundled seed packs and activate a default if none is
    // chosen yet (spec 003 R5). Never overrides an existing active pack.
    await installSeedPacks();
    console.log(`[gr] onInstalled (${details.reason}): migrations + wasm cache + seed packs done`);
  })();
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  // Trust boundary: a message crossing chrome.runtime is untyped and may come
  // from a compromised page. Validate the shape before acting on it (R3).
  if (!isClassifyRequest(message)) {
    const err: ErrorResponse = { kind: "error", message: "unrecognized or malformed message" };
    sendResponse(err);
    return false; // responded synchronously
  }

  void (async () => {
    try {
      const t = performance.now();
      // classify() builds/reuses the classifier for the active pack (or the
      // request's packId) via the loader — spec 003 R2/R6.
      const result = await classify(message.text, message.packId);
      console.log(
        `[gr-bench] classify warm=${(performance.now() - t).toFixed(3)}ms verdict=${result.verdict}`,
      );
      const res: ClassifyResponse = {
        kind: "classify.result",
        verdict: result.verdict,
        matches: result.matches,
      };
      sendResponse(res);
    } catch (e) {
      const err: ErrorResponse = {
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      };
      sendResponse(err);
    }
  })();

  // Return true = we will call sendResponse asynchronously; without it Chrome
  // closes the message channel before our reply lands.
  return true;
});

// --- Dev affordance -------------------------------------------------------
// Exposes the core on the worker global so you can exercise it directly from
// the service-worker DevTools console during manual testing, with no page or
// messaging context to get wrong:
//   await gr.classify("algebra and photosynthesis")            // active pack
//   await gr.classify("photosynthesis", "cbse-class7")         // specific pack
//   await gr.sanitize("email me at kid@example.com")
// Uses globalThis (= the worker's `self`) so it also loads harmlessly under the
// Node test runner. Purely a debugging convenience; safe to delete.
(globalThis as unknown as { gr?: unknown }).gr = {
  classify: async (text: string, packId?: string) => classify(text, packId),
  sanitize: async (text: string) => (await ensureCore()).sanitize(text),
};
