// Proves the R5 WASM lifecycle end-to-end without Chrome: cache the real
// compiled bytes into (mocked) chrome.storage, instantiate the core from those
// cached bytes, and run a real sanitize(). This is the substitute for the
// "loaded in Chrome" evidence when the browser blocks CLI extension loading
// (L-008) — the instantiation path here is identical to the service worker's.
// Classification moved to pack/loader.ts (spec 003); its tests live there.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it, expect, vi } from "vitest";
import {
  ensureCore,
  cacheWasmBytes,
  bytesToBase64,
  base64ToBytes,
  __resetCoreForTest,
} from "./core.js";
import * as storage from "./storage.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(HERE, "..", "..", "core-wasm", "pkg", "guiderail_core_bg.wasm");
const wasmBytes = new Uint8Array(readFileSync(WASM_PATH));

beforeAll(() => {
  // core.ts fetches the packaged .wasm via chrome.runtime.getURL()+fetch; serve
  // the real bytes from disk so instantiation exercises the actual module.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(wasmBytes, { headers: { "Content-Type": "application/wasm" } })),
  );
});

describe("WASM core lifecycle (R5)", () => {
  it("round-trips wasm bytes through base64 without loss", () => {
    expect(base64ToBytes(bytesToBase64(wasmBytes))).toEqual(wasmBytes);
  });

  it("caches bytes on install, instantiates from the cache, and classifies", async () => {
    __resetCoreForTest();

    // Simulates onInstalled: fetch packaged wasm → cache in storage.
    await cacheWasmBytes();
    expect(typeof (await storage.get("wasm.bytes"))).toBe("string");

    // Simulates a cold worker wake: instantiate from cached bytes.
    const core = await ensureCore();

    // The sanitize() choke point is reachable across the boundary.
    expect(core.sanitize("email me at kid@example.com")).toContain("[EMAIL]");

    // A cold-init timing mark was recorded for the bench harness.
    expect(await storage.get("core.timing")).toMatchObject({ cold_ms: expect.any(Number) });
  });

  it("returns the same instance on a warm call", async () => {
    const a = await ensureCore();
    const b = await ensureCore();
    expect(a).toBe(b);
  });
});
