// Integration coverage for the service worker itself (spec 002 R3 + R5).
//
// The other suites test messages/storage/core in isolation; this one drives the
// actual registered listeners to prove the wiring and — critically — the
// acceptance criterion "kill the worker, trigger a message, state survives
// (storage, not module scope)".

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it, expect, vi } from "vitest";
import * as storage from "./storage.js";
import { __resetCoreForTest } from "./core.js";
import { __resetClassifiersForTest, DEFAULT_PACK_ID } from "./pack/loader.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(HERE, "..", "..", "core-wasm", "pkg", "guiderail_core_bg.wasm");
const wasmBytes = new Uint8Array(readFileSync(WASM_PATH));

// Importing the SW module registers its listeners on the mocked chrome.runtime.
// Grab the registered handlers so we can invoke them like Chrome would.
let onMessage: (msg: unknown, sender: unknown, sendResponse: (r: unknown) => void) => boolean;
let onInstalled: (details: { reason: string }) => void;
let fetchCalls = 0;

beforeAll(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      fetchCalls++;
      return new Response(wasmBytes, { headers: { "Content-Type": "application/wasm" } });
    }),
  );
  await import("./service_worker.js");
  const rt = chrome.runtime as unknown as {
    onMessage: { addListener: { mock: { calls: unknown[][] } } };
    onInstalled: { addListener: { mock: { calls: unknown[][] } } };
  };
  onMessage = rt.onMessage.addListener.mock.calls[0]![0] as typeof onMessage;
  onInstalled = rt.onInstalled.addListener.mock.calls[0]![0] as typeof onInstalled;
});

/** Invoke the async onMessage handler and resolve with the response it sends. */
function send(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    onMessage(message, {}, resolve);
  });
}

/** Drive onInstalled (caches wasm + installs seed packs) and wait until the
 *  default pack is active. Resets the module-scope classifier cache first so
 *  each test starts cold, as a fresh worker would. */
async function seedActivePack(): Promise<void> {
  __resetClassifiersForTest();
  onInstalled({ reason: "install" });
  await vi.waitFor(async () => {
    expect(await storage.getActivePackId()).toBe(DEFAULT_PACK_ID);
  });
}

describe("service worker wiring (R3/R5)", () => {
  it("registers listeners synchronously at top level", () => {
    expect(typeof onMessage).toBe("function");
    expect(typeof onInstalled).toBe("function");
  });

  it("onInstalled runs migrations + caches wasm bytes + seeds packs", async () => {
    __resetClassifiersForTest();
    onInstalled({ reason: "install" });
    await vi.waitFor(async () => {
      expect(await storage.get("wasm.bytes")).toBeTypeOf("string");
      expect(await storage.get("meta.version")).toBe(storage.STORAGE_VERSION);
      expect(await storage.getActivePackId()).toBe(DEFAULT_PACK_ID);
    });
  });

  it("dispatches a valid classify message against the active seed pack", async () => {
    await seedActivePack();
    // No packId → classify against the active pack (R6).
    const res = await send({ kind: "classify", text: "algebra homework" });
    expect(res).toMatchObject({ kind: "classify.result", verdict: "allow" });
    expect((res as { matches: string[] }).matches).toContain("math");
  });

  it("rejects an ad-hoc / malformed payload with a typed error (R3)", async () => {
    const res = await send({ kind: "evil", foo: 1 });
    expect(res).toEqual({ kind: "error", message: expect.any(String) });
  });

  it("state survives a simulated worker kill (storage, not module scope)", async () => {
    // Seed as onInstalled would, then classify once to warm the core + classifier.
    await seedActivePack();
    await send({ kind: "classify", text: "geometry" });
    expect(await storage.get("wasm.bytes")).toBeTypeOf("string");

    // Kill the worker: module scope evaporates (core + classifier caches gone).
    __resetCoreForTest();
    __resetClassifiersForTest();
    const before = fetchCalls;

    // Trigger a message on the "restarted" worker. It must re-instantiate from
    // the STORAGE-cached bytes and rebuild the classifier from the STORAGE-cached
    // pack (no new fetch), proving durable state lived in chrome.storage and not
    // in a module-scope variable.
    const res = await send({ kind: "classify", text: "photosynthesis" });
    expect(res).toMatchObject({ kind: "classify.result", verdict: "allow" });
    expect(fetchCalls).toBe(before); // re-instantiated from storage, not re-fetched
  });
});
