import { describe, it, expect } from "vitest";
import * as storage from "./storage.js";

describe("storage module (R4)", () => {
  it("namespaces keys as gr.v1.*", async () => {
    await storage.set("meta.version", 1);
    const raw = await chrome.storage.local.get("gr.v1.meta.version");
    expect(raw["gr.v1.meta.version"]).toBe(1);
  });

  it("get/set/remove round-trip", async () => {
    expect(await storage.get("wasm.bytes")).toBeUndefined();
    await storage.set("wasm.bytes", "AAAA");
    expect(await storage.get("wasm.bytes")).toBe("AAAA");
    await storage.remove("wasm.bytes");
    expect(await storage.get("wasm.bytes")).toBeUndefined();
  });

  it("runMigrations stamps the current version when absent", async () => {
    expect(await storage.get("meta.version")).toBeUndefined();
    await storage.runMigrations();
    expect(await storage.get("meta.version")).toBe(storage.STORAGE_VERSION);
  });
});
